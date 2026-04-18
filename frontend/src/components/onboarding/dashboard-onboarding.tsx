"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { hapticSuccess, hapticTap } from "@/lib/telegram-haptics";

const STORAGE_KEY = "yieldpay_onboarding_v1";

type Step = { selector: string | null; title: string; body: string };

const STEPS: Step[] = [
  {
    selector: "coverage-hero",
    title: "Coverage %",
    body: "This shows how much of your subscription is covered by your monthly yield."
  },
  {
    selector: "total-invested",
    title: "Total invested",
    body: "Your total TON staked on Tonstakers through YieldPay."
  },
  {
    selector: "monthly-yield",
    title: "Monthly yield",
    body: "What you earn each month in dollars at the current APY and TON price."
  },
  {
    selector: "add-investment",
    title: "Add investment",
    body: "Start here to stake more TON and increase coverage."
  },
  {
    selector: "withdraw-action",
    title: "Withdraw",
    body: "Withdraw anytime — network fees apply."
  },
  {
    selector: "subscription-section",
    title: "Subscription",
    body: "See monthly cost, how much is covered, and what’s left."
  },
  {
    selector: null,
    title: "You're all set 🚀",
    body: "Explore coverage, add TON when you're ready, and manage withdrawals from here."
  }
];

function useHighlightRect(selector: string | null, step: number, visible: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!visible || !selector) {
      setRect(null);
      return;
    }
    const update = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
      if (el) setRect(el.getBoundingClientRect());
      else setRect(null);
    };
    update();
    const id = window.setTimeout(update, 400);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [selector, step, visible]);

  return rect;
}

export function DashboardOnboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  const cfg = STEPS[step];
  const selector = cfg?.selector ?? null;
  const rect = useHighlightRect(selector, step, visible);
  const isLast = step >= STEPS.length - 1;

  const finish = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
    setVisible(false);
    hapticSuccess();
  }, []);

  useEffect(() => {
    if (!visible || !selector) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [visible, selector, step]);

  if (!mounted || !visible || !cfg) return null;

  /** Dimming without backdrop-blur — full-viewport blur was smearing the highlighted card. */
  const dimClass = "fixed z-[100] bg-black/50 pointer-events-auto";
  const ringPad = 4;

  const portal = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        aria-modal
        role="dialog"
        aria-labelledby="onboarding-title"
      >
        {rect && selector ? (
          <>
            {/* Four panels = real cutout; content in the hole stays sharp and undimmed. */}
            <div className={dimClass} style={{ top: 0, left: 0, right: 0, height: rect.top }} aria-hidden />
            <div
              className={dimClass}
              style={{ top: rect.bottom, left: 0, right: 0, bottom: 0 }}
              aria-hidden
            />
            <div
              className={dimClass}
              style={{
                top: rect.top,
                left: 0,
                width: rect.left,
                height: rect.height
              }}
              aria-hidden
            />
            <div
              className={dimClass}
              style={{
                top: rect.top,
                left: rect.right,
                right: 0,
                height: rect.height
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none fixed z-[101] rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-transparent shadow-[0_0_28px_rgba(79,140,255,0.5)]"
              style={{
                top: rect.top - ringPad,
                left: rect.left - ringPad,
                width: rect.width + ringPad * 2,
                height: rect.height + ringPad * 2
              }}
              aria-hidden
            />
          </>
        ) : (
          <div className={`${dimClass} inset-0`} aria-hidden />
        )}

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[102] flex justify-center p-4 pb-6">
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/12 bg-gradient-to-b from-slate-950/98 to-slate-950 p-5 shadow-[0_-12px_60px_rgba(0,0,0,0.45)] dark:from-slate-950 dark:to-black"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Step {step + 1} / {STEPS.length}
              </span>
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => {
                  hapticTap();
                  finish();
                }}
              >
                Skip
              </button>
            </div>
            <h2 id="onboarding-title" className="text-lg font-bold text-foreground">
              {cfg.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cfg.body}</p>
            <div className="mt-5 flex gap-2">
              {step > 0 ? (
                <Button
                  variant="secondary"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    hapticTap();
                    setStep((s) => Math.max(0, s - 1));
                  }}
                >
                  Back
                </Button>
              ) : null}
              <Button
                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-primary to-accent font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_16px_48px_rgba(79,140,255,0.25)]"
                onClick={() => {
                  hapticTap();
                  if (isLast) finish();
                  else setStep((s) => s + 1);
                }}
              >
                {isLast ? "Done" : "Next"}
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(portal, document.body);
}
