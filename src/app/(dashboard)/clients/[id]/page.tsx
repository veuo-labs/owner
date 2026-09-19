"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClientProfileById, type EnrichedClient, executeOrderPaymentVerification, markOrderReadyForHandover } from "@/lib/zedwix-store";
import type { ZedwixOrder } from "@/lib/types";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Store,
  ExternalLink,
  ShieldCheck,
  Check,
  Clock,
  Printer,
  Copy,
  Eye,
  Package,
} from "lucide-react";
import Link from "next/link";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<EnrichedClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "store" | "managed" | "notes">("orders");
  const [selectedOrder, setSelectedOrder] = useState<ZedwixOrder | null>(null);

  // Local client notes
  const [notes, setNotes] = useState<Array<{ id: string; content: string; date: string }>>([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  async function loadClientData() {
    try {
      setLoading(true);
      const found = await getClientProfileById(clientId);
      setClient(found);

      // Load saved notes for this client
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`zedwix_client_notes_${clientId}`);
          if (raw) setNotes(JSON.parse(raw));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Error loading client profile:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    const item = {
      id: "note-" + Date.now(),
      content: newNote.trim(),
      date: new Date().toLocaleString(),
    };

    const updated = [item, ...notes];
    setNotes(updated);
    setNewNote("");
    if (typeof window !== "undefined") {
      localStorage.setItem(`zedwix_client_notes_${clientId}`, JSON.stringify(updated));
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
        Loading client profile...
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ padding: "3rem" }}>
        <Link
          href="/clients"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "1.5rem" }}
        >
          <ArrowLeft size={16} /> Back to Clients
        </Link>
        <div className="empty-state">
          <span className="empty-state-title">Client Profile Not Found</span>
          <span className="empty-state-desc">The requested client record does not exist or has been removed.</span>
        </div>
      </div>
    );
  }

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "CL";

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/clients"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--color-text-secondary)",
          textDecoration: "none",
          fontSize: "0.875rem",
          marginBottom: "1.5rem",
        }}
      >
        <ArrowLeft size={16} />
        Back to Clients
      </Link>

      {/* Client Overview Card Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Left: Client Profile Details */}
        <div className="metric-card" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
            <div
              className="avatar avatar-lg"
              style={{
                background: "var(--color-accent)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.25rem",
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "0 0 0.2rem" }}>{client.name}</h1>
                <span className={`status-badge ${client.status}`}>
                  <span className="status-badge-dot" />
                  {client.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                {client.business}
              </div>

              {/* Contact Icons */}
              <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem", flexWrap: "wrap" }}>
                {client.whatsapp && (
                  <a
                    href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.85rem",
                      color: "#22c55e",
                      textDecoration: "none",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <Phone size={14} /> {client.whatsapp}
                  </a>
                )}
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.85rem",
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <Mail size={14} /> {client.email}
                  </a>
                )}
                {client.address && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    <MapPin size={14} /> {client.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Connected Store Banner */}
          {client.store && (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1rem 1.25rem",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Store size={20} style={{ color: "var(--color-accent)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Connected Store: {client.store.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                    /{client.store.slug} • {client.store.productCount || 0} Products in Catalogue
                  </div>
                </div>
              </div>
              <a
                href={`https://${client.store.slug}.pages.dev`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.75rem" }}
              >
                <ExternalLink size={12} /> Open Live Storefront
              </a>
            </div>
          )}
        </div>

        {/* Right: Financial & Scope Summary */}
        <div className="metric-card" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            Financial Summary
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>Total Billed</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                PKR {client.totalBilled.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>Paid</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#22c55e" }}>
                PKR {client.totalPaid.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", paddingTop: "0.85rem" }}>
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Due Balance</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: client.totalDue > 0 ? "var(--color-status-danger)" : "inherit",
                }}
              >
                PKR {client.totalDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-list" style={{ marginBottom: "1.5rem" }}>
        <button
          className={`tab-trigger ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Orders ({client.orders.length})
        </button>
        <button
          className={`tab-trigger ${activeTab === "store" ? "active" : ""}`}
          onClick={() => setActiveTab("store")}
        >
          Storefront & Handover
        </button>
        <button
          className={`tab-trigger ${activeTab === "managed" ? "active" : ""}`}
          onClick={() => setActiveTab("managed")}
        >
          Managed Care
        </button>
        <button
          className={`tab-trigger ${activeTab === "notes" ? "active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          Notes & History ({notes.length})
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === "orders" && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Plan Name</th>
                <th>Turnaround</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Handover Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {client.orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-muted)" }}>
                    No orders registered yet for this client.
                  </td>
                </tr>
              ) : (
                client.orders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{ord.id}</td>
                    <td style={{ fontWeight: 600 }}>{ord.purchase?.plan}</td>
                    <td>{ord.purchase?.deliveryTurnaround || "Standard"}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>
                      PKR {Number(ord.purchase?.amountDueToday || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={`status-badge ${ord.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        <span className="status-badge-dot" />
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                        {ord.handoverStatus || "Pending Delivery"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      {new Date(ord.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                        onClick={() => setSelectedOrder(ord)}
                      >
                        <Eye size={12} />
                        View Record
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Storefront & Handover */}
      {activeTab === "store" && (
        <div className="metric-card" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Storefront & Handover Status</h3>
          {client.store ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ background: "var(--color-surface)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <div><strong>Store Name:</strong> {client.store.name}</div>
                <div><strong>Slug:</strong> /{client.store.slug}</div>
                <div><strong>Owner Email:</strong> {client.store.ownerEmail || "—"}</div>
                <div><strong>Catalog Items:</strong> {client.store.productCount || 0} products</div>
                <div style={{ marginTop: "0.75rem" }}>
                  <a
                    href={`https://${client.store.slug}.pages.dev`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <ExternalLink size={14} /> Open Storefront
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              No store linked to this client yet. Use the Stores tab to deploy one.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Managed Care */}
      {activeTab === "managed" && (
        <div className="metric-card" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Managed Store Subscription</h3>
          <div style={{ background: "var(--color-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
            <div>Tier: <strong style={{ color: client.managedTier !== "none" ? "#22c55e" : "inherit" }}>{client.managedTier.toUpperCase()}</strong></div>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0.5rem 0 0" }}>
              {client.managedTier === "full"
                ? "Full Store Management: Up to 25 updates/month, WhatsApp product uploads, banner/coupon setup."
                : client.managedTier === "basic"
                ? "Basic Platform Care: Hosting keep-alive, backups, uptime monitoring, bug fixes."
                : "Self-Managed: Client manages store updates independently."}
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Notes */}
      {activeTab === "notes" && (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          <form onSubmit={handleAddNote} style={{ display: "flex", gap: "0.75rem" }}>
            <input
              className="form-input"
              placeholder="Add an operational note for this client..."
              style={{ flex: 1 }}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Add Note
            </button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {notes.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-desc">No notes recorded yet for this client.</span>
              </div>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="metric-card" style={{ padding: "1rem" }}>
                  <div style={{ fontSize: "0.875rem", marginBottom: "0.4rem" }}>{n.content}</div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                    {n.date}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: VIEW ORDER DETAIL */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}>
          <div className="modal-content" style={{ maxWidth: "680px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Order Record: {selectedOrder.id}</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Agreement: {selectedOrder.agreementId}</span>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div style={{ background: "var(--color-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.875rem", lineHeight: "1.8", marginBottom: "1rem" }}>
              <div>Plan: <strong>{selectedOrder.purchase?.plan}</strong></div>
              <div>Turnaround: <strong>{selectedOrder.purchase?.deliveryTurnaround || "Standard"}</strong></div>
              <div>Total Due: <strong style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>PKR {Number(selectedOrder.purchase?.amountDueToday || 0).toLocaleString()}</strong></div>
              <div>Status: <strong>{selectedOrder.status}</strong></div>
              <div>Handover: <strong>{selectedOrder.handoverStatus || "Pending Setup"}</strong></div>
              {selectedOrder.paymentReceipt?.dataUrl && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginBottom: "0.3rem" }}>Payment Receipt:</div>
                  <img src={selectedOrder.paymentReceipt.dataUrl} style={{ maxHeight: "120px", borderRadius: "4px" }} alt="Receipt" />
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Link href="/orders" className="btn btn-primary" onClick={() => setSelectedOrder(null)}>
                Open in Orders Panel →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
