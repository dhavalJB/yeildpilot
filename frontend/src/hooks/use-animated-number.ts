"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

/**
 * Smoothly interpolates toward `value` for count-up display. No business logic — display only.
 */
export function useAnimatedNumber(value: number, duration = 0.85) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    const from = displayRef.current;
    const controls = animate(from, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        setDisplay(v);
        displayRef.current = v;
      },
      onComplete: () => {
        displayRef.current = value;
      }
    });
    return () => controls.stop();
  }, [value, duration]);

  return display;
}
