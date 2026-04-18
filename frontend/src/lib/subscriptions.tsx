"use client";

import { Film, Music2, Bot, Crown, ShoppingBag } from "lucide-react";

export type SubscriptionId =
  | "netflix"
  | "spotify"
  | "amazon"
  | "telegram_premium";

export type Subscription = {
  id: SubscriptionId;
  name: string;
  monthlyUsd: number;
  color: string;
  icon: React.ReactNode;
};

export const subscriptions: Subscription[] = [
  {
    id: "netflix",
    name: "Netflix Premium",
    monthlyUsd: 26,
    color: "#E50914",
    icon: <Film />
  },
  {
    id: "spotify",
    name: "Spotify",
    monthlyUsd: 11.99,
    color: "#1DB954",
    icon: <Music2 />
  },
  {
    id: "amazon",
    name: "Amazon Prime",
    monthlyUsd: 14.99,
    color: "#38BDF8",
    icon: <ShoppingBag />
  },
  {
    id: "telegram_premium",
    name: "Telegram Premium",
    monthlyUsd: 4.99,
    color: "#2AABEE",
    icon: <Crown />
  }
];

export function getSubscriptionById(id: string) {
  return (
    subscriptions.find((s) => s.id === id) ??
    subscriptions.find((s) => s.id === "netflix")!
  );
}

