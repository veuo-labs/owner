"use client";

import { useEffect, useState } from "react";
import {
  fetchLiveOrders,
  fetchLiveClients,
  type EnrichedClient,
} from "@/lib/zedwix-store";
import type { ZedwixOrder, StoreListItem } from "@/lib/types";
import {
  Users,
  Store,
  CreditCard,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Eye,
  Package,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [orders, setOrders] = useState<ZedwixOrder[]>([]);
  const [clients, setClients] = useState<EnrichedClient[]>([]);
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllDashboardData();
    const handler = () => loadAllDashboardData();
    window.addEventListener("zedwix:order_received", handler);
    return () => window.removeEventListener("zedwix:order_received", handler);
  }, []);

  async function loadAllDashboardData() {
    try {
      const [ordList, clientList] = await Promise.all([
        fetchLiveOrders(),
        fetchLiveClients(),
      ]);

      setOrders(ordList);
      setClients(clientList);

      try {
        const res = await fetch("/api/stores");
        const json = await res.json();
        if (json.success && json.stores) {
          setStores(json.stores);
        }
      } catch (e) {}
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Aggregate Metrics
  const totalBilled = orders.reduce((sum, o) => sum + Number(o.purchase?.amountDueToday || 0), 0);
  const totalReceived = orders
    .filter((o) => o.status === "Payment Verified" || o.paymentVerification?.verified)
    .reduce((sum, o) => sum + Number(o.purchase?.amountDueToday || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "Payment Review").length;
  const deliveredCount = orders.filter(
    (o) => o.status === "Delivered" || o.handoverStatus === "Accepted & Delivered"
  ).length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          ZEDWIX OWNER DASHBOARD
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
          Live central overview of your client orders, deployed storefronts, and payment verifications.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="metric-label">Total Clients</span>
            <Users size={18} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <div className="metric-value">{clients.length}</div>
          <div className="metric-trend positive" style={{ fontSize: "0.75rem" }}>
            Active Accounts
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="metric-label">Client Storefronts</span>
            <Store size={18} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <div className="metric-value">{stores.length}</div>
          <div className="metric-trend positive" style={{ fontSize: "0.75rem" }}>
            Live in Production
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="metric-label">Funds Verified</span>
            <CreditCard size={18} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <div className="metric-value" style={{ color: "#22c55e" }}>
            PKR {totalReceived.toLocaleString()}
          </div>
          <div className="metric-trend positive" style={{ fontSize: "0.75rem" }}>
            Received to Date
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="metric-label">Payment Review</span>
            <Clock size={18} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <div className="metric-value" style={{ color: pendingCount > 0 ? "var(--color-status-danger)" : "inherit" }}>
            {pendingCount}
          </div>
          <div className="metric-trend" style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Awaiting Verification
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="metric-label">Delivered & Signed</span>
            <CheckCircle size={18} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <div className="metric-value">{deliveredCount}</div>
          <div className="metric-trend positive" style={{ fontSize: "0.75rem" }}>
            Handover Complete
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Active Stores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "flex-start" }}>
        {/* Left: Recent Incoming Orders */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Recent Client Orders</h2>
            <Link href="/orders" className="btn btn-secondary btn-sm" style={{ fontSize: "0.75rem" }}>
              View All Orders ({orders.length}) →
            </Link>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Client</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-muted)" }}>
                      Loading live orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-muted)" }}>
                      No orders recorded yet. As clients checkout, their orders will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 6).map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{o.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.client?.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{o.client?.business}</div>
                      </td>
                      <td>{o.purchase?.plan}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        PKR {Number(o.purchase?.amountDueToday || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className={`status-badge ${o.status.toLowerCase().replace(/\s+/g, "-")}`}>
                          <span className="status-badge-dot" />
                          {o.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                        {new Date(o.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td>
                        <Link href="/orders" className="btn btn-secondary btn-sm" style={{ fontSize: "0.725rem", padding: "0.2rem 0.55rem" }}>
                          <Eye size={12} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live Client Storefronts */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Client Storefronts</h2>
            <Link href="/stores" className="btn btn-secondary btn-sm" style={{ fontSize: "0.75rem" }}>
              Manage →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {stores.length === 0 ? (
              <div className="metric-card" style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                No active storefronts found.
              </div>
            ) : (
              stores.slice(0, 6).map((s) => (
                <div
                  key={s.id}
                  className="metric-card"
                  style={{
                    padding: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>
                      /{s.slug}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      {s.productCount || 0} products • {s.ownerEmail || "No login linked"}
                    </div>
                  </div>
                  <a
                    href={`https://${s.slug}.pages.dev`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: "0.35rem" }}
                    title="Open live storefront"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
