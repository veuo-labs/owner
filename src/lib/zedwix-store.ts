import { createClient } from "@/lib/supabase/client";
import type { ZedwixOrder, StoreListItem, OwnerNote } from "./types";

export const STORAGE_KEY_ORDERS = "zedwix_engine_orders_v1";
export const REALTIME_CHANNEL = "zedwix-owner-live";
export const CURRENT_STORE_ID = "zedwix-default-store";

export async function getCurrentStoreId(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.user_metadata?.store_id) return session.user.user_metadata.store_id;
  return CURRENT_STORE_ID;
}

export interface EnrichedClient {
  id: string;
  name: string;
  business: string;
  whatsapp: string;
  email: string;
  address: string;
  city?: string;
  plans: string[];
  managedTier: string;
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
  status: "active" | "inactive";
  lastActivity: string;
  orders: ZedwixOrder[];
  store?: StoreListItem;
}

// In-memory cache for fast responsive rendering
let cachedOrders: ZedwixOrder[] = [];
const listeners: Array<() => void> = [];

export function subscribeToZedwixStore(cb: () => void) {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notifySubscribers() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
}

/**
 * Reads stored orders from localStorage (shared with zedwix-engine.js and owner.html)
 */
export function getLocalStoredOrders(): ZedwixOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalStoredOrders(orders: ZedwixOrder[], broadcast = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    cachedOrders = orders;

    if (broadcast) {
      if (typeof BroadcastChannel !== "undefined") {
        try {
          const ch = new BroadcastChannel("zedwix_orders_channel");
          ch.postMessage({ type: "ORDERS_UPDATED", timestamp: Date.now() });
          ch.close();
        } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent("zedwix:orders_updated", { detail: orders }));
      notifySubscribers();
    }
  } catch (e) {
    console.error("Error saving orders to localStorage:", e);
  }
}

/**
 * Fetches all orders by combining Supabase (store_notifications / owner_orders)
 * and localStorage records.
 */
export async function fetchLiveOrders(): Promise<ZedwixOrder[]> {
  const local = getLocalStoredOrders();
  const supabase = createClient();
  const orderMap = new Map<string, ZedwixOrder>();

  // Add local first
  local.forEach((o) => {
    if (o && o.id) orderMap.set(o.id, o);
  });

  try {
    // 1. Try owner_orders table if exists
    const { data: ownerOrders } = await supabase
      .from("owner_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ownerOrders && ownerOrders.length > 0) {
      ownerOrders.forEach((row: any) => {
        const order: ZedwixOrder = {
          id: row.id,
          agreementId: row.agreement_id || row.id,
          agreementVersion: row.agreement_version || 2,
          handoverToken: row.handover_token,
          handoverStatus: row.handover_status || "Pending Delivery",
          status: row.status || "Payment Review",
          createdAt: row.created_at,
          client: row.client,
          purchase: row.purchase,
          historicalSnapshot: row.historical_snapshot,
          evidence: row.evidence,
          handoverEvidence: row.handover_evidence,
          paymentReceipt: row.payment_receipt,
          paymentVerification: row.payment_verification,
          managedStoreTracking: row.managed_store_tracking,
          auditTrail: row.audit_trail || [],
          liveStoreUrl: row.live_store_url,
        };
        orderMap.set(order.id, order);
      });
    }
  } catch (e) {}

  try {
    // 2. Fetch from store_notifications where orders are backed up
    const { data: notifs } = await supabase
      .from("store_notifications")
      .select("*")
      .eq("type", "order_created")
      .order("created_at", { ascending: false })
      .limit(50);

    if (notifs) {
      for (const n of notifs) {
        if (n.message && n.message.startsWith("{")) {
          try {
            const ord: ZedwixOrder = JSON.parse(n.message);
            if (ord && ord.id && !orderMap.has(ord.id)) {
              orderMap.set(ord.id, ord);
            }
          } catch (err) {}
        }
      }
    }
  } catch (e) {}

  const merged = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  cachedOrders = merged;
  if (merged.length > 0) {
    saveLocalStoredOrders(merged, false);
  }
  return merged;
}

/**
 * Approves and activates an order's payment.
 */
export async function executeOrderPaymentVerification(
  orderId: string,
  amount: number,
  reference: string
): Promise<boolean> {
  const orders = cachedOrders.length > 0 ? cachedOrders : getLocalStoredOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return false;

  const nowIso = new Date().toISOString();
  order.status = "Payment Verified";
  order.paymentVerification = {
    verified: true,
    verifiedBy: "Owner",
    verifiedAt: nowIso,
    amountVerified: amount,
    paymentReference: reference,
  };

  if (!order.auditTrail) order.auditTrail = [];
  order.auditTrail.unshift({
    event: `Payment verified & plan activated: PKR ${amount.toLocaleString()} (${reference})`,
    timestamp: nowIso,
    actor: "Owner",
  });

  saveLocalStoredOrders(orders, true);

  const supabase = createClient();

  // Broadcast realtime update
  try {
    const channel = supabase.channel(REALTIME_CHANNEL);
    channel.send({
      type: "broadcast",
      event: "PAYMENT_VERIFIED",
      payload: {
        orderId,
        verification: order.paymentVerification,
      },
    });
  } catch (e) {}

  // Update in Supabase
  try {
    await supabase.from("owner_orders").update({
      status: "Payment Verified",
      payment_verification: order.paymentVerification,
      audit_trail: order.auditTrail,
    }).eq("id", orderId);
  } catch (e) {}

  return true;
}

/**
 * Generates a handover sign-off link for client electronic sign-off.
 */
export async function markOrderReadyForHandover(
  orderId: string,
  liveStoreUrl: string
): Promise<string | null> {
  const orders = cachedOrders.length > 0 ? cachedOrders : getLocalStoredOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;

  const nowIso = new Date().toISOString();
  if (!order.handoverToken) {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let token = "";
    for (let i = 0; i < 16; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    order.handoverToken = token;
  }

  order.handoverStatus = "Store Delivered - Pending Client Sign-off";
  order.liveStoreUrl = liveStoreUrl;

  if (!order.auditTrail) order.auditTrail = [];
  order.auditTrail.unshift({
    event: `Store setup completed (${liveStoreUrl}). Handover sign-off link issued to client.`,
    timestamp: nowIso,
    actor: "Owner",
  });

  saveLocalStoredOrders(orders, true);

  const supabase = createClient();
  try {
    await supabase.from("owner_orders").update({
      handover_status: order.handoverStatus,
      live_store_url: liveStoreUrl,
      handover_token: order.handoverToken,
      audit_trail: order.auditTrail,
    }).eq("id", orderId);
  } catch (e) {}

  return order.handoverToken;
}

/**
 * Logs a managed store maintenance update (e.g. products added, price updated).
 */
export async function logManagedStoreUpdate(
  orderId: string,
  type: string,
  notes: string
): Promise<boolean> {
  const orders = cachedOrders.length > 0 ? cachedOrders : getLocalStoredOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return false;

  const isFull = order.purchase?.managedStoreTier === "full";
  const defaultTotal = isFull ? 25 : 10;

  if (!order.managedStoreTracking) {
    order.managedStoreTracking = {
      active: true,
      tierId: order.purchase?.managedStoreTier || "basic",
      tierTitle: isFull ? "Full Store Management" : "Basic Platform Care",
      startDate: new Date().toISOString(),
      currentMonth: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      updatesTotal: defaultTotal,
      updatesUsed: 0,
      updatesRemaining: defaultTotal,
      history: [],
    };
  }

  const tracking = order.managedStoreTracking;
  tracking.updatesUsed = (tracking.updatesUsed || 0) + 1;
  tracking.updatesRemaining = Math.max(0, (tracking.updatesTotal || defaultTotal) - tracking.updatesUsed);

  const dateFormatted = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!tracking.history) tracking.history = [];
  tracking.history.unshift({
    id: "upd-" + Date.now(),
    dateFormatted,
    type,
    notes,
  });

  saveLocalStoredOrders(orders, true);

  const supabase = createClient();
  try {
    await supabase.from("owner_orders").update({
      managed_store_tracking: tracking,
    }).eq("id", orderId);
  } catch (e) {}

  return true;
}

/**
 * Builds the comprehensive client directory derived from live orders and real Supabase stores.
 */
export async function fetchLiveClients(): Promise<EnrichedClient[]> {
  const orders = await fetchLiveOrders();
  let stores: StoreListItem[] = [];

  try {
    const res = await fetch("/api/stores");
    const json = await res.json();
    if (json.success && json.stores) {
      stores = json.stores;
    }
  } catch (e) {}

  const clientMap = new Map<string, EnrichedClient>();

  // 1. Group clients from Orders
  orders.forEach((o) => {
    if (!o.client) return;
    const email = (o.client.email || "").trim().toLowerCase();
    const phone = (o.client.whatsapp || "").replace(/[^0-9]/g, "");
    const key = email || phone || o.client.name.toLowerCase().replace(/\s+/g, "-");

    const amount = Number(o.purchase?.amountDueToday || 0);
    const isPaid = o.status === "Payment Verified";

    if (!clientMap.has(key)) {
      clientMap.set(key, {
        id: encodeURIComponent(key),
        name: o.client.name || "Client",
        business: o.client.business || "Store",
        whatsapp: o.client.whatsapp || "",
        email: o.client.email || "",
        address: o.client.address || "",
        plans: [o.purchase?.plan || "Starter"],
        managedTier: o.purchase?.managedStoreTier || (o.purchase?.managedStore ? "basic" : "none"),
        totalBilled: amount,
        totalPaid: isPaid ? amount : 0,
        totalDue: isPaid ? 0 : amount,
        status: "active",
        lastActivity: o.createdAt,
        orders: [o],
      });
    } else {
      const existing = clientMap.get(key)!;
      existing.totalBilled += amount;
      if (isPaid) existing.totalPaid += amount;
      else existing.totalDue += amount;
      if (o.purchase?.plan && !existing.plans.includes(o.purchase.plan)) {
        existing.plans.push(o.purchase.plan);
      }
      if (o.purchase?.managedStoreTier && o.purchase.managedStoreTier !== "none") {
        existing.managedTier = o.purchase.managedStoreTier;
      }
      existing.orders.push(o);
      if (new Date(o.createdAt) > new Date(existing.lastActivity)) {
        existing.lastActivity = o.createdAt;
      }
    }
  });

  // 2. Attach or synthesize clients from live Stores
  stores.forEach((s) => {
    let matched = false;
    const ownerEmail = (s.ownerEmail || "").trim().toLowerCase();
    const sPhone = (s.whatsapp_number || s.contact_number || "").replace(/[^0-9]/g, "");

    for (const c of clientMap.values()) {
      const cEmail = c.email.trim().toLowerCase();
      const cPhone = c.whatsapp.replace(/[^0-9]/g, "");
      const cBiz = c.business.toLowerCase().replace(/[^a-z0-9]/g, "");
      const sSlug = s.slug.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (
        (ownerEmail && cEmail === ownerEmail) ||
        (sPhone && cPhone && (cPhone.includes(sPhone) || sPhone.includes(cPhone))) ||
        (cBiz && sSlug && (cBiz.includes(sSlug) || sSlug.includes(cBiz)))
      ) {
        c.store = s;
        matched = true;
        break;
      }
    }

    if (!matched && (s.name !== "Default Store" || s.slug !== "shandar-perfumes")) {
      // Create client entry for existing store if not already in orders
      const key = ownerEmail || s.slug;
      clientMap.set(key, {
        id: encodeURIComponent(key),
        name: s.name.toUpperCase(),
        business: s.name,
        whatsapp: s.whatsapp_number || s.contact_number || "",
        email: s.ownerEmail || "",
        address: "Active Deployment",
        plans: ["Turnkey Store Engine"],
        managedTier: "basic",
        totalBilled: 12000,
        totalPaid: 12000,
        totalDue: 0,
        status: "active",
        lastActivity: s.created_at,
        orders: [],
        store: s,
      });
    }
  });

  return Array.from(clientMap.values()).sort(
    (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );
}

/**
 * Retrieves a single client profile by ID.
 */
export async function getClientProfileById(clientId: string): Promise<EnrichedClient | null> {
  const clients = await fetchLiveClients();
  const decoded = decodeURIComponent(clientId).toLowerCase();

  const found = clients.find(
    (c) =>
      c.id === clientId ||
      c.id.toLowerCase() === decoded ||
      c.email.toLowerCase() === decoded ||
      c.whatsapp.replace(/[^0-9]/g, "") === decoded.replace(/[^0-9]/g, "") ||
      c.business.toLowerCase().replace(/\s+/g, "-") === decoded
  );

  return found || null;
}
