"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-[transform,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,_0_18px_60px_rgba(79,140,255,0.22)] hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,_0_24px_80px_rgba(79,140,255,0.28),_0_0_40px_rgba(34,211,238,0.15)]",
        secondary:
          "border border-slate-200/90 bg-white text-foreground shadow-sm hover:bg-slate-50 hover:scale-[1.02] hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:bg-white/10 dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
        ghost: "hover:bg-white/10 hover:scale-[1.01]",
        destructive: "bg-red-600 text-white hover:bg-red-500"
      },
      size: {
        default: "h-12 px-5",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-6 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  /** When `loading` is true, show this copy instead of children (spinner + label). */
  loadingLabel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      loadingLabel,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="inline-flex min-h-[1.25em] items-center justify-center gap-2">
            <Loader2
              className={cn(
                "size-4 shrink-0 animate-spin",
                variant === "default" ? "text-primary-foreground/90" : "text-current opacity-90"
              )}
              aria-hidden
            />
            {loadingLabel ? (
              <motion.span
                className="text-[0.95em] font-semibold tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {loadingLabel}
              </motion.span>
            ) : (
              <span className="opacity-88 transition-opacity duration-300">{children}</span>
            )}
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

