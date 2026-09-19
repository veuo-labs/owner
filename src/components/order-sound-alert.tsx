"use client";

import { useEffect, useState, useRef } from "react";

interface OrderSoundAlertProps {
  storeSlug?: string;
}

export function OrderSoundAlert({ storeSlug }: OrderSoundAlertProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const lastOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsGranted(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    if (!soundEnabled) return;
    const handler = () => {
      playOrderChime();
    };
    window.addEventListener("zedwix:orders_updated", handler);
    return () => window.removeEventListener("zedwix:orders_updated", handler);
  }, [soundEnabled]);

  function playOrderChime() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.08);
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio chime notice:", e);
    }
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setNotificationsGranted(perm === "granted");
      if (perm === "granted") {
        new Notification("Zedwix Alerts Enabled", {
          body: "You will now receive sound and instant desktop alerts for incoming customer orders.",
        });
      }
    } catch (e) {}
  }

  return (
    <div className="flex items-center gap-2">
      {!notificationsGranted && (
        <button
          type="button"
          onClick={requestNotificationPermission}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-border rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Enable desktop notifications for orders"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Enable Alerts
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (!soundEnabled) {
            playOrderChime();
          }
          setSoundEnabled(!soundEnabled);
        }}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors ${
          soundEnabled
            ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
            : "border-border text-muted-foreground hover:bg-muted"
        }`}
        title={soundEnabled ? "Order sound alerts active (click to mute)" : "Order sound alerts muted (click to enable)"}
      >
        {soundEnabled ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" strokeWidth="2" />
            <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" strokeWidth="2" />
          </svg>
        )}
        <span className="font-mono text-[10px] font-semibold">{soundEnabled ? "ALERTS ON" : "MUTED"}</span>
      </button>
    </div>
  );
}
