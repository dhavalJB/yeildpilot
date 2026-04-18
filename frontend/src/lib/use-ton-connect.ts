"use client";

import { useMemo } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

type TonTx = {
  validUntil: number;
  messages: Array<{ address: string; amount: string; payload?: string }>;
};

export function useTonConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const walletAddress = wallet?.account?.address ?? null;

  return useMemo(
    () => ({
      walletAddress,
      isConnected: Boolean(walletAddress),
      sendTransaction: async (transaction: TonTx) =>
        tonConnectUI.sendTransaction(transaction)
    }),
    [walletAddress, tonConnectUI]
  );
}

