"use client";

import Link from "next/link";
import { BadgePlus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { subscriptions } from "@/lib/subscriptions";
import { useAppStore } from "@/lib/store";
import { formatTonAdaptive } from "@/lib/format";
import { SubscriptionsPageSkeleton } from "@/components/page-skeletons";

const meta: Record<string, { desc: string }> = {
  netflix: { desc: "Premium • 4 users" },
  spotify: { desc: "Family • 6 users" },
  amazon: { desc: "Prime • fast delivery" },
  telegram_premium: { desc: "Premium • 1 user" }
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
  }
};

export function SubscriptionsClient() {
  const { market } = useAppStore();

  if (market.lastUpdatedAt === null) {
    return <SubscriptionsPageSkeleton />;
  }

  return (
    <div className="space-y-6 pb-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="glass premium-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-bold tracking-tight">Choose a subscription</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
              <Sparkles className="size-4 text-ton-400" />
              Premium yield coverage
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {subscriptions.map((s) => (
          <motion.div key={s.id} variants={item}>
            <Link href={`/solo?subscription=${s.id}`} className="block h-full">
              <Card className="glass premium-card h-full p-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
                    style={{ boxShadow: `0 0 0 1px ${s.color}20 inset` }}
                  >
                    <span style={{ color: s.color }}>{s.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{s.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {meta[s.id]?.desc ?? "Subscription"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-muted-foreground">Price / month</div>
                  <div className="mt-0.5 text-lg font-bold tabular-nums">
                    {s.monthlyUsd.toLocaleString(undefined, {
                      style: "currency",
                      currency: "USD"
                    })}{" "}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    ~
                    {formatTonAdaptive(market.tonUsd > 0 ? s.monthlyUsd / market.tonUsd : 0)}
                    {" "}
                    TON / month
                  </div>
                  <Button className="mt-3 w-full rounded-xl" size="sm">
                    Select
                  </Button>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}

        <motion.div variants={item} className="col-span-2">
          <Card className="glass premium-card p-5 opacity-80">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <span className="text-accent">+</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">More coming soon</div>
                <div className="text-xs text-muted-foreground">
                  We’re adding more subscriptions as partners launch on TON.
                </div>
              </div>
              <Button variant="secondary" disabled className="rounded-xl">
                Soon
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
