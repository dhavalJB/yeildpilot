import { Address, fromNano } from "@ton/core";
import { StonApiClient } from "@ston-fi/api";

const client = new StonApiClient();

let cachedTonAssetAddress: string | null = null;

async function getNativeTonAssetAddress(): Promise<string> {
  if (cachedTonAssetAddress) return cachedTonAssetAddress;
  const assets = await client.getAssets();
  const ton = assets.find((a) => a.kind === "Ton");
  if (!ton?.contractAddress) {
    throw new Error("Native TON asset not found in STON.fi registry");
  }
  cachedTonAssetAddress = ton.contractAddress;
  return cachedTonAssetAddress;
}

function normalizeMaster(addr: string): string {
  const parsed = Address.parse(addr.trim());
  return parsed.toString({ bounceable: true, urlSafe: true });
}

export type ConvertToTonResult = {
  tonAmount: number;
  usedStonFi: boolean;
  /** Present when estimation used STON.fi simulation */
  swapRate?: string;
  /** User-facing note */
  message?: string;
  fallback?: boolean;
};

/**
 * Estimate TON received for a jetton amount via STON.fi, or pass through native TON.
 * `token` must be jetton master address (EQ…/UQ…) or the literal "TON".
 */
export async function convertToTON(amount: number, token: string): Promise<ConvertToTonResult> {
  const t = token.trim();
  const isTon =
    t === "" ||
    t.toUpperCase() === "TON" ||
    t.toLowerCase() === "native";

  if (isTon) {
    return {
      tonAmount: amount,
      usedStonFi: false,
      message: "Native TON — no conversion."
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  let jettonMaster: string;
  try {
    jettonMaster = normalizeMaster(t);
  } catch {
    throw new Error("Invalid jetton master address");
  }

  const [tonAsk, jettonMeta] = await Promise.all([
    getNativeTonAssetAddress(),
    client.getAsset(jettonMaster)
  ]);

  if (jettonMeta.kind === "NotAnAsset") {
    throw new Error("Unknown asset on STON.fi");
  }

  const decimals = Math.min(18, Math.max(0, Number(jettonMeta.decimals) || 9));
  const raw = BigInt(Math.floor(amount * 10 ** decimals));
  if (raw <= 0n) {
    throw new Error("Amount too small after decimals");
  }

  const simulation = await client.simulateSwap({
    offerAddress: jettonMaster,
    offerUnits: raw.toString(),
    askAddress: tonAsk,
    slippageTolerance: "0.01",
    dexV2: true
  });

  const askNano = BigInt(simulation.askUnits);
  const tonAmount = Number(fromNano(askNano));

  if (!Number.isFinite(tonAmount) || tonAmount <= 0) {
    throw new Error("Invalid TON amount from STON.fi simulation");
  }

  return {
    tonAmount,
    usedStonFi: true,
    swapRate: simulation.swapRate,
    message: "Estimated via STON.fi swap simulation."
  };
}
