"use client";

export function mapTransactionError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const normalized = raw.toLowerCase();

  if (
    normalized.includes("userrejectserror") ||
    normalized.includes("rejected") ||
    normalized.includes("cancel")
  ) {
    return "Transaction was not approved";
  }

  if (
    normalized.includes("ton_connect_sdk_error") ||
    normalized.includes("ton connect sdk error")
  ) {
    return "Wallet connection failed. Please try again";
  }

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("timeout")
  ) {
    return "Network issue. Check your connection and try again";
  }

  if (normalized.includes("429") || normalized.includes("too many requests")) {
    return "Network busy, retrying...";
  }

  if (
    normalized.includes("500") ||
    normalized.includes("400") ||
    normalized.includes("invalid_request") ||
    normalized.includes("backend") ||
    normalized.includes("internal")
  ) {
    return "Something went wrong. Please try again";
  }

  return "Unexpected error occurred. Please retry";
}

