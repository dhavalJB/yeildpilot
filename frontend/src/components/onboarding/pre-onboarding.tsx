"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hapticTap } from "@/lib/telegram-haptics";
import { cn } from "@/lib/utils";

/** Shown once before the dashboard tutorial. Value `"true"` = completed. */
export const PRE_ONBOARDING_STORAGE_KEY = "onboarding_complete";

const SCREENS = [
  {
    title: "YieldPay",
    subtitle: "Turn your TON into monthly income",
    body: null as string[] | null
  },
  {
    title: "How it works",
    subtitle: "Make your subscriptions pay for themselves",
    body: [
      "Stake your TON",
      "Earn monthly yield",
      "Automatically cover Netflix, Spotify, and more"
    ]
  },
  {
    title: "Why use YieldPay",
    subtitle: null as string | null,
    body: ["Passive income", "Non-custodial", "Withdraw anytime"]
  },
  {
    title: "Important Information",
    subtitle: null as string | null,
    body: [
      "Yield may vary",
      "Crypto risk",
      "Smart contract risk",
      "Wallet approval required"
    ],
    risk: true as const
  }
] as const;

type Screen = (typeof SCREENS)[number];

function LegalModal({
  open,
  onOpenChange,
  title,
  children
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[220] bg-black/55" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[221] max-h-[min(80dvh,520px)] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-base font-semibold text-foreground">{title}</Dialog.Title>
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
          <Dialog.Description asChild>
            <div className="mt-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function PreOnboarding() {
  const [mounted, setMounted] = useState(false);
  const [gate, setGate] = useState<"unknown" | "show" | "hide">("unknown");
  const [step, setStep] = useState(0);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [legalOpen, setLegalOpen] = useState<"terms" | "privacy" | null>(null);

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(PRE_ONBOARDING_STORAGE_KEY) === "true") {
        setGate("hide");
        return;
      }
    } catch {
      setGate("hide");
      return;
    }
    setGate("show");
  }, []);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(PRE_ONBOARDING_STORAGE_KEY, "true");
    } catch {
      /* noop */
    }
    hapticTap();
    setGate("hide");
  }, []);

  const goNext = useCallback(() => {
    hapticTap();
    if (step >= SCREENS.length - 1) return;
    setStep((s) => s + 1);
  }, [step]);

  const goPrev = useCallback(() => {
    hapticTap();
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX;
    if (end == null) return;
    const dx = end - start;
    if (dx < -48) goNext();
    else if (dx > 48) goPrev();
  };

  if (!mounted || gate === "unknown" || gate === "hide") return null;

  const screen = SCREENS[step] as Screen;
  const isLast = step === SCREENS.length - 1;
  const canFinish = !isLast || riskAccepted;

  const panel = (
    /* Always dark + explicit light text — do not use theme `foreground` (wrong in light mode). */
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#060912] text-white antialiased">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgba(79, 140, 255, 0.22), transparent 42%), radial-gradient(circle at 85% 10%, rgba(34, 211, 238, 0.12), transparent 45%), linear-gradient(180deg, #0a0e18 0%, #070a12 50%, #04060d 100%)"
        }}
      />

      <div
        className="relative flex min-h-0 flex-1 flex-col px-6 pt-14 pb-8"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="mb-8 flex justify-center gap-1.5">
          {SCREENS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                hapticTap();
                setStep(i);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/35"
              )}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[1] flex h-full flex-col"
            >
              <h1
                className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
                style={{ textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
              >
                {screen.title}
              </h1>
              {screen.subtitle ? (
                <p
                  className="mt-4 text-center text-base leading-relaxed text-slate-200/95"
                  style={{ textShadow: "0 1px 12px rgba(0,0,0,0.35)" }}
                >
                  {screen.subtitle}
                </p>
              ) : null}

              {screen.body ? (
                <ul className="mx-auto mt-10 max-w-sm flex-1 space-y-4">
                  {screen.body.map((line) => (
                    <li
                      key={line}
                      className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3.5 text-[15px] font-medium leading-snug text-white"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent" />
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="min-h-[120px] flex-1" aria-hidden />
              )}

              {"risk" in screen && screen.risk ? (
                <div className="mt-auto space-y-4 pt-6">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.08] p-4">
                    <input
                      type="checkbox"
                      checked={riskAccepted}
                      onChange={(e) => {
                        hapticTap();
                        setRiskAccepted(e.target.checked);
                      }}
                      className="mt-1 size-4 shrink-0 rounded border-white/30 bg-white/15 text-sky-500 focus:ring-sky-400"
                    />
                    <span className="text-sm leading-snug text-white">
                      I understand the risks
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                    <button
                      type="button"
                      className="font-medium text-sky-300 underline-offset-4 hover:text-white hover:underline"
                      onClick={() => {
                        hapticTap();
                        setLegalOpen("terms");
                      }}
                    >
                      Terms of Service
                    </button>
                    <span className="text-white/35">·</span>
                    <button
                      type="button"
                      className="font-medium text-sky-300 underline-offset-4 hover:text-white hover:underline"
                      onClick={() => {
                        hapticTap();
                        setLegalOpen("privacy");
                      }}
                    >
                      Privacy Policy
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative mt-6 space-y-3">
          {!isLast ? (
            <Button
              type="button"
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-semibold text-white shadow-lg shadow-sky-500/20"
              onClick={goNext}
            >
              Next
              <ChevronRight className="ml-1 size-5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-semibold text-white shadow-lg shadow-sky-500/20 disabled:opacity-40"
              disabled={!canFinish}
              onClick={complete}
            >
              Continue
            </Button>
          )}
          <p className="text-center text-[11px] text-slate-400">Swipe to move between screens</p>
        </div>
      </div>

      <LegalModal
        open={legalOpen === "terms"}
        onOpenChange={(o) => !o && setLegalOpen(null)}
        title="Terms of Service"
      >
        <p>
          These Terms of Service govern your use of YieldPay. By continuing, you agree to use the app only
          with funds you can afford to lose and to follow applicable laws. YieldPay provides informational
          and interface tools; on-chain actions are executed by your wallet. We may update these terms; continued
          use constitutes acceptance.
        </p>
        <p className="mt-3">
          This is a summary for the hackathon demo — replace with your final legal text before production.
        </p>
      </LegalModal>

      <LegalModal
        open={legalOpen === "privacy"}
        onOpenChange={(o) => !o && setLegalOpen(null)}
        title="Privacy Policy"
      >
        <p>
          YieldPay processes wallet addresses and usage data needed to operate the Mini App. We do not custody
          your private keys. Data may be stored locally on your device or sent to our servers only as required for
          core features. You can disconnect your wallet at any time.
        </p>
        <p className="mt-3">
          This is a summary for the hackathon demo — replace with your final policy before production.
        </p>
      </LegalModal>
    </div>
  );

  return createPortal(panel, document.body);
}
