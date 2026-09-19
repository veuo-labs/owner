"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OwnerClient, OwnerProject, OwnerPayment } from "@/lib/types";
import { getLocalStoredOrders, saveLocalStoredOrders } from "@/lib/zedwix-store";

export interface ToastItem {
  id: string;
  type: "order" | "success" | "info" | "warning";
  title: string;
  message: string;
  timestamp: string;
  orderId?: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  unreadCount: number;
  notifications: ToastItem[];
  clearNotifications: () => void;
  markAllRead: () => void;
  playChime: (type?: "order" | "ping") => void;
  recentOrders: any[];
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  unreadCount: 0,
  notifications: [],
  clearNotifications: () => {},
  markAllRead: () => {},
  playChime: () => {},
  recentOrders: [],
});

export const useRealtime = () => useContext(RealtimeContext);

const REALTIME_CHANNEL = "zedwix-owner-live";
export const CRM_CACHE_KEY = "zedwix_master_crm_v1";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<ToastItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio Context
  function initAudio() {
    try {
      if (!audioCtxRef.current && typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
    } catch (e) {
      console.warn("Web Audio not available:", e);
    }
  }

  function playChime(type: "order" | "ping" = "order") {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === "order") {
        // Dual-tone futuristic luxury chime (880Hz -> 1320Hz)
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.exponentialRampToValueAtTime(660, now + 0.15);

        gainNode.gain.setValueAtTime(0.35, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.7);
        osc2.stop(now + 0.7);
      } else {
        // High-C ping
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(1046.5, now);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.start(now);
        osc1.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Error playing chime:", e);
    }
  }

  function showToast(item: Omit<ToastItem, "id" | "timestamp">) {
    const id = "toast-" + Math.random().toString(36).substring(2, 9);
    const toastItem: ToastItem = {
      ...item,
      id,
      timestamp: new Date().toISOString(),
    };

    setToasts((prev) => [toastItem, ...prev.slice(0, 4)]);
    setNotifications((prev) => [toastItem, ...prev.slice(0, 19)]);
    setUnreadCount((c) => c + 1);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }

  // Handle incoming order and provision CRM entities
  async function handleIncomingOrder(order: any) {
    if (!order || !order.id) return;
    console.log("[Realtime] Incoming Order Received:", order);

    const clientName = order.client?.name || "New Client";
    const businessName = order.client?.business || "Client Store";
    const planName = order.purchase?.plan || "Business";
    const amount = order.purchase?.amountDueToday || 12000;

    playChime("order");

    showToast({
      type: "order",
      title: `🎉 New Order: ${order.id}`,
      message: `${clientName} chose ${planName} Plan for "${businessName}" (Rs. ${Number(amount).toLocaleString()})`,
      orderId: order.id,
    });

    setRecentOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === order.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = order;
        return copy;
      }
      return [order, ...prev];
    });

    try {
      await autoProvisionFromOrder(order);
    } catch (err) {
      console.warn("[Realtime] Error provisioning CRM records:", err);
    }

    // Persist order to localStorage orders cache for offline/fast access
    if (typeof window !== "undefined") {
      const existing = getLocalStoredOrders();
      const alreadyExists = existing.some((o: any) => o.id === order.id);
      if (!alreadyExists) {
        saveLocalStoredOrders([order, ...existing]);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("zedwix:order_received", { detail: order }));
    }
  }

  async function autoProvisionFromOrder(order: any) {
    const supabase = createClient();
    const clientId = `cl-${order.id.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const projectId = `prj-${order.id.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const nowIso = new Date().toISOString();

    const clientData: Partial<OwnerClient> = {
      id: clientId,
      name: order.client?.name || "Client",
      company: order.client?.business || "Store",
      email: order.client?.email || "",
      phone: order.client?.whatsapp || "",
      whatsapp: order.client?.whatsapp || "",
      address: order.client?.address || "",
      total_billed: Number(order.purchase?.amountDueToday || 0),
      total_paid: order.paymentVerification?.verified ? Number(order.purchase?.amountDueToday || 0) : 0,
      total_due: order.paymentVerification?.verified ? 0 : Number(order.purchase?.amountDueToday || 0),
      status: "active",
      last_activity: nowIso,
      created_at: nowIso,
      order_id: order.id,
    };

    const projectData: Partial<OwnerProject> = {
      id: projectId,
      client_id: clientId,
      name: `${order.purchase?.plan || "Store"} Setup — ${order.client?.business || "Brand"}`,
      description: `Turnkey ${order.purchase?.plan} package setup for ${order.client?.name} with ${order.purchase?.deliveryTurnaround || "standard"} turnaround. Domain: ${order.purchase?.domainChoice || "subdomain"}.`,
      status: order.paymentVerification?.verified ? "in_progress" : "pending",
      deadline: calculateDeadline(order.purchase?.deliveryTurnaround),
      total_amount: Number(order.purchase?.amountDueToday || 0),
      paid_amount: order.paymentVerification?.verified ? Number(order.purchase?.amountDueToday || 0) : 0,
      due_amount: order.paymentVerification?.verified ? 0 : Number(order.purchase?.amountDueToday || 0),
      created_at: nowIso,
      updated_at: nowIso,
    };

    const paymentData: Partial<OwnerPayment> = {
      id: `pay-${order.id.toLowerCase()}`,
      client_id: clientId,
      project_id: projectId,
      invoice_number: `INV-${order.id.replace("ZW-2026-", "")}`,
      amount: Number(order.purchase?.amountDueToday || 0),
      method: (order.purchase?.paymentMethod || "bank_transfer").replace(/^(bank_.*)$/, "bank_transfer"),
      date: nowIso.split("T")[0],
      status: order.paymentVerification?.verified ? "paid" : "pending",
      transaction_id: order.paymentReceipt?.transactionId || null,
      notes: `Order ${order.id} via pricing checkout. Delivery mode: ${order.purchase?.deliveryMode || "Standard"}.`,
      created_at: nowIso,
    };

    try {
      const raw = localStorage.getItem(CRM_CACHE_KEY);
      const crm = raw ? JSON.parse(raw) : { clients: [], projects: [], payments: [], activities: [] };

      const cIdx = crm.clients.findIndex((c: any) => c.id === clientId || c.order_id === order.id);
      if (cIdx >= 0) crm.clients[cIdx] = { ...crm.clients[cIdx], ...clientData };
      else crm.clients.unshift(clientData);

      const pIdx = crm.projects.findIndex((p: any) => p.id === projectId);
      if (pIdx >= 0) crm.projects[pIdx] = { ...crm.projects[pIdx], ...projectData };
      else crm.projects.unshift(projectData);

      const payIdx = crm.payments.findIndex((p: any) => p.id === paymentData.id);
      if (payIdx >= 0) crm.payments[payIdx] = { ...crm.payments[payIdx], ...paymentData };
      else crm.payments.unshift(paymentData);

      crm.activities.unshift({
        id: `act-${Date.now()}`,
        entity_type: "client",
        entity_id: clientId,
        action: "Plan Selected & Order Placed",
        description: `${order.client?.name} subscribed to ${order.purchase?.plan} Plan (Rs. ${Number(order.purchase?.amountDueToday || 0).toLocaleString()})`,
        actor: "Client Checkout",
        created_at: nowIso,
      });

      localStorage.setItem(CRM_CACHE_KEY, JSON.stringify(crm));
    } catch (e) {
      console.warn("Local cache save error:", e);
    }

    try {
      await supabase.from("owner_clients").upsert(clientData);
      await supabase.from("owner_projects").upsert(projectData);
      await supabase.from("owner_payments").upsert(paymentData);
    } catch (e) {
      // Graceful fallback
    }
  }

  function calculateDeadline(turnaroundStr?: string): string {
    const days = turnaroundStr?.includes("1") ? 1 : turnaroundStr?.includes("2") ? 2 : turnaroundStr?.includes("3") ? 3 : 7;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  useEffect(() => {
    const supabase = createClient();

    async function fetchHistorical() {
      try {
        const { data: notifs } = await supabase
          .from("store_notifications")
          .select("*")
          .eq("type", "order_created")
          .order("created_at", { ascending: false })
          .limit(20);

        if (notifs) {
          const orders: any[] = [];
          for (const n of notifs) {
            try {
              if (n.message && n.message.startsWith("{")) {
                const ord = JSON.parse(n.message);
                orders.push(ord);
                autoProvisionFromOrder(ord);
              }
            } catch (e) {}
          }
          if (orders.length > 0) {
            setRecentOrders(orders);
          }
        }
      } catch (e) {
        console.warn("Error loading historical orders:", e);
      }
    }

    fetchHistorical();

    console.log("[Realtime] Connecting to channel:", REALTIME_CHANNEL);
    const channel = supabase.channel(REALTIME_CHANNEL, {
      config: { broadcast: { self: true } },
    });

    channel
      .on("broadcast", { event: "ORDER_CREATED" }, (payload) => {
        console.log("[Realtime] Broadcast ORDER_CREATED received:", payload);
        handleIncomingOrder(payload.payload);
      })
      .on("broadcast", { event: "PLAN_SELECTED" }, (payload) => {
        console.log("[Realtime] Broadcast PLAN_SELECTED received:", payload);
        playChime("ping");
        showToast({
          type: "info",
          title: "Plan Selection",
          message: `Visitor selected ${payload.payload?.planName || "a plan"} on pricing page`,
        });
      })
      .on("broadcast", { event: "PAYMENT_VERIFIED" }, (payload) => {
        playChime("ping");
        showToast({
          type: "success",
          title: "Payment Verified",
          message: `Order ${payload.payload?.orderId} payment was confirmed.`,
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("zedwix:payment_verified", { detail: payload.payload }));
        }
      })
      .on("broadcast", { event: "STORE_CREATED" }, (payload) => {
        playChime("ping");
        showToast({
          type: "success",
          title: "Store Created",
          message: `Store "${payload.payload?.storeName}" (${payload.payload?.slug}) is now deployed.`,
        });
      })
      .on("broadcast", { event: "STORE_DELETED" }, (payload) => {
        showToast({
          type: "warning",
          title: "Store Deleted",
          message: `Store "${payload.payload?.name}" was removed.`,
        });
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "store_notifications" },
        (payload) => {
          const notif = payload.new;
          if (notif?.type === "order_created" && notif?.message?.startsWith("{")) {
            try {
              const order = JSON.parse(notif.message);
              handleIncomingOrder(order);
            } catch (e) {}
          }
        }
      );

    channel.subscribe((status) => {
      console.log("[Realtime] Channel status:", status);
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setIsConnected(false);
      }
    });

    function handleStorage(e: StorageEvent) {
      if (e.key === "zedwix_engine_orders_v1" && e.newValue) {
        try {
          const list = JSON.parse(e.newValue);
          if (Array.isArray(list) && list.length > 0) {
            handleIncomingOrder(list[0]);
          }
        } catch (err) {}
      }
    }
    window.addEventListener("storage", handleStorage);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function clearNotifications() {
    setNotifications([]);
    setUnreadCount(0);
  }

  function markAllRead() {
    setUnreadCount(0);
  }

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        unreadCount,
        notifications,
        clearNotifications,
        markAllRead,
        playChime,
        recentOrders,
      }}
    >
      {children}

      {/* Floating Toast Banners */}
      <div
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          maxWidth: "400px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: "auto",
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-accent)",
              borderRadius: "10px",
              padding: "0.875rem 1.125rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--color-accent)",
                marginTop: "0.4rem",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.2rem" }}>
                {t.title}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                {t.message}
              </div>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: "0 0.25rem",
                fontSize: "1rem",
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </RealtimeContext.Provider>
  );
}
