"use client";

import { useEffect, useState } from "react";
import {
  fetchLiveOrders,
  logManagedStoreUpdate,
  subscribeToZedwixStore,
} from "@/lib/zedwix-store";
import type { ZedwixOrder } from "@/lib/types";
import { ShieldCheck, Plus, CheckCircle, Clock } from "lucide-react";

export default function ManagedStoresPage() {
  const [orders, setOrders] = useState<ZedwixOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<Record<string, string>>({});
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadManagedOrders();
    const unsub = subscribeToZedwixStore(() => {
      loadManagedOrders();
    });
    return () => unsub();
  }, []);

  async function loadManagedOrders() {
    try {
      const allOrders = await fetchLiveOrders();
      // Filter orders that selected managed store or default stores with care
      const managed = allOrders.filter(
        (o) =>
          o.purchase?.managedStore ||
          o.purchase?.managedStoreTier === "full" ||
          o.purchase?.managedStoreTier === "basic" ||
          Boolean(o.managedStoreTracking?.active)
      );
      setOrders(managed);
    } catch (err) {
      console.error("Error loading managed stores:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogUpdate(orderId: string) {
    const type = selectedType[orderId] || "Product added";
    const notes = notesInput[orderId] || "";

    setActionLoading(orderId);
    try {
      const success = await logManagedStoreUpdate(orderId, type, notes);
      if (success) {
        setNotesInput((prev) => ({ ...prev, [orderId]: "" }));
        loadManagedOrders();
      }
    } catch (err) {
      console.error("Error logging update:", err);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          MANAGED STORE TRACKING
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
          Track monthly maintenance quotas (10 or 25 updates/month) and log catalog service updates.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
          Loading managed store subscriptions...
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <ShieldCheck size={40} style={{ color: "var(--color-text-muted)" }} />
          <span className="empty-state-title">No active Managed Store subscriptions</span>
          <span className="empty-state-desc">
            When clients checkout with Basic Platform Care (2k/mo) or Full Store Management (5k/mo), their monthly update allowances will appear here.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {orders.map((o) => {
            const isFull = o.purchase?.managedStoreTier === "full";
            const defaultTotal = isFull ? 25 : 10;
            const tracking = o.managedStoreTracking || {
              updatesRemaining: defaultTotal,
              updatesTotal: defaultTotal,
              currentMonth: "Current Month",
              history: [],
            };

            const tierLabel = isFull
              ? 'Full Store Management ("Done-For-You")'
              : "Basic Platform Care";
            const feeLabel = isFull ? "PKR 5,000 / month" : "PKR 2,000 / month";

            return (
              <div
                key={o.id}
                className="metric-card"
                style={{ padding: "2rem", border: "1px solid var(--color-border)" }}
              >
                {/* Top Info */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                      ORDER: {o.id}
                    </span>
                    <h3 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0.2rem 0", color: "var(--color-text)" }}>
                      {o.client?.business} ({o.client?.name})
                    </h3>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: 0 }}>
                      Plan: <strong>{o.purchase?.plan}</strong> • Add-on:{" "}
                      <strong style={{ color: "#22c55e" }}>{tierLabel}</strong> ({feeLabel})
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: (tracking.updatesRemaining || 0) > 0 ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {tracking.updatesRemaining} / {tracking.updatesTotal}
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      updates remaining this month
                    </span>
                  </div>
                </div>

                {/* Log Update Controls */}
                <div
                  style={{
                    marginTop: "1.5rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid var(--color-border)",
                    display: "flex",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <select
                    className="form-input"
                    style={{ width: "210px", fontSize: "0.85rem" }}
                    value={selectedType[o.id] || "Product added"}
                    onChange={(e) => setSelectedType({ ...selectedType, [o.id]: e.target.value })}
                  >
                    <option value="Product added">Product added</option>
                    <option value="Price updated">Price updated</option>
                    <option value="Stock changed">Stock changed</option>
                    <option value="Product removed">Product removed</option>
                    <option value="Category updated">Category updated</option>
                    <option value="Seasonal Banner / Coupon added">Seasonal Banner / Coupon added</option>
                  </select>

                  <input
                    className="form-input"
                    placeholder="Update notes (e.g. Added 5 summer shirts via WhatsApp)..."
                    style={{ flex: 1, minWidth: "220px", fontSize: "0.85rem" }}
                    value={notesInput[o.id] || ""}
                    onChange={(e) => setNotesInput({ ...notesInput, [o.id]: e.target.value })}
                  />

                  <button
                    className="btn btn-primary"
                    disabled={actionLoading === o.id}
                    onClick={() => handleLogUpdate(o.id)}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <Plus size={14} />
                    {actionLoading === o.id ? "Logging..." : "Log Update"}
                  </button>
                </div>

                {/* History */}
                <div style={{ marginTop: "1.5rem" }}>
                  <h5 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", margin: "0 0 0.5rem" }}>
                    Service Update History ({tracking.history ? tracking.history.length : 0})
                  </h5>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {tracking.history && tracking.history.length > 0 ? (
                      tracking.history.map((h, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: "0.85rem",
                            padding: "0.4rem 0",
                            borderBottom: "1px solid var(--color-border)",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", marginRight: "0.5rem" }}>
                              {h.dateFormatted}
                            </span>
                            <strong style={{ color: "var(--color-text)" }}>{h.type}</strong>
                            {h.notes ? (
                              <span style={{ color: "var(--color-text-secondary)", marginLeft: "0.5rem" }}>
                                ({h.notes})
                              </span>
                            ) : null}
                          </div>
                          <span style={{ color: "#22c55e", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                            ✓ Logged
                          </span>
                        </li>
                      ))
                    ) : (
                      <li style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                        No maintenance updates logged yet this month.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
