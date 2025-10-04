"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * MaintenanceGate
 * - Shows a full-screen overlay with a maintenance/trailer message.
 * - Hidden unlock: click anywhere on the overlay 5 times within a short window to unlock the app.
 * - Persists unlock in localStorage (key: maintenanceUnlocked = "1").
 */
export default function MaintenanceGate() {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [clicks, setClicks] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // On mount, check if previously unlocked
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("maintenanceUnlocked") : null;
      if (saved === "1") setUnlocked(true);
    } catch (_) {
      // ignore storage errors
    }

    // Sync across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === "maintenanceUnlocked" && e.newValue === "1") {
        setUnlocked(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleClick = () => {
    if (unlocked) return;

    setClicks((prev) => {
      const next = prev + 1;

      // Reset the timer on first click in a sequence
      if (prev === 0) {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          setClicks(0);
        }, 6000); // 6-second window to complete 5 clicks
      }

      if (next >= 7) {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        try {
          localStorage.setItem("maintenanceUnlocked", "1");
        } catch (_) {
          // ignore storage errors
        }
        setUnlocked(true);
        return 0;
      }

      return next;
    });
  };

  if (unlocked) return null;

  return (
    <div
      onClick={handleClick}
      className="fixed inset-0 z-[9999] flex overflow-hidden items-center justify-center bg-white/80 backdrop-blur-xl select-none"
      aria-hidden
    >
      <div className="mx-4 overflow-hidden max-w-lg rounded-2xl border border-white/15 bg-white/5 p-6 text-center text-black shadow-2xl">
        <div className="mb-3 text-sm uppercase tracking-widest text-black/70">We are cooking something</div>
        <h1 className="mb-2 text-2xl font-semibold">This app is being updated</h1>
        <p className="mb-4 text-black/80">All functionalities are temporarily paused while we prepare the next release.</p>

      </div>
    </div>
  );
}
