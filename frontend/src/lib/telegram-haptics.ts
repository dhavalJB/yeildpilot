"use client";

/**
 * Telegram Mini App haptics — no-ops outside Telegram. Subtle use only.
 * https://core.telegram.org/bots/webapps#hapticfeedback
 */

type ImpactStyle = "light" | "medium" | "soft" | "rigid" | "heavy";
type NotificationType = "error" | "success" | "warning";

function getWebApp() {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: ImpactStyle) => void; notificationOccurred: (t: NotificationType) => void } } };
  };
  return w.Telegram?.WebApp;
}

export function hapticImpact(style: ImpactStyle = "light") {
  try {
    getWebApp()?.HapticFeedback?.impactOccurred(style);
  } catch {
    /* noop */
  }
}

export function hapticNotify(type: NotificationType) {
  try {
    getWebApp()?.HapticFeedback?.notificationOccurred(type);
  } catch {
    /* noop */
  }
}

/** Primary button / control tap */
export function hapticTap() {
  hapticImpact("light");
}

/** Successful completion */
export function hapticSuccess() {
  hapticImpact("medium");
}

/** Transaction or critical failure */
export function hapticError() {
  hapticNotify("error");
}
