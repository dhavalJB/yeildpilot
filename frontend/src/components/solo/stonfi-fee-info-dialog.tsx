"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hapticTap } from "@/lib/telegram-haptics";

export function StonfiFeeInfoDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/5"
          aria-label="Fee details"
          onClick={() => hapticTap()}
        >
          <HelpCircle className="size-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed bottom-0 left-1/2 z-[91] max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 overflow-y-auto rounded-t-2xl border border-border/80 bg-card p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950/95 sm:bottom-auto sm:top-1/2 sm:max-h-[min(90dvh,560px)] sm:-translate-y-1/2 sm:rounded-2xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-base font-semibold leading-snug text-foreground">
              Fees &amp; network costs
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
                onClick={() => hapticTap()}
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Gas / network:</span> blockchain fees cannot be lower than{" "}
              <span className="tabular-nums font-semibold text-foreground">0.001 TON</span> per message; typical swaps and
              stakes often land around <span className="tabular-nums font-semibold text-foreground">0.05–0.08 TON</span>{" "}
              depending on congestion.
            </p>
            <p>
              <span className="font-medium text-foreground">Typical swap fee:</span> about{" "}
              <span className="tabular-nums font-semibold text-foreground">0.1%</span> protocol +{" "}
              <span className="tabular-nums font-semibold text-foreground">0.2%</span> pool (≈{" "}
              <span className="tabular-nums font-semibold text-foreground">0.3%</span> combined). It can reach up to ~{" "}
              <span className="tabular-nums font-semibold text-foreground">1%</span> depending on the token and route.
            </p>
            <p>
              <span className="font-medium text-foreground">Execution buffer:</span> extra TON may be reserved for safe
              execution; unused TON is typically refunded by the protocol after the transaction settles.
            </p>
            <p className="text-xs text-muted-foreground/90">
              Quotes are indicative. Final amounts depend on pool state, slippage, and network conditions.
            </p>
          </Dialog.Description>
          <div className="mt-5">
            <Dialog.Close asChild>
              <Button className="w-full rounded-xl" variant="secondary" onClick={() => hapticTap()}>
                Got it
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
