"use client";

import { useEffect, useState } from "react";
import { fetchLiveClients, subscribeToZedwixStore, type EnrichedClient } from "@/lib/zedwix-store";
import { Users, Search, Store as StoreIcon, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ClientsPage() {
  const [clients, setClients] = useState<EnrichedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadClients();
    const unsub = subscribeToZedwixStore(() => {
      loadClients();
    });
    return () => unsub();
  }, []);

  async function loadClients() {
    try {
      const list = await fetchLiveClients();
      setClients(list);
    } catch (err) {
      console.error("Error loading clients:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.business || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.whatsapp || "").includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>CLIENTS DIRECTORY</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Clients connected to registered orders, active stores, and delivery sign-offs.
          </p>
        </div>
      </div>

      {/* Search & Counter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div className="topbar-search" style={{ width: "100%", maxWidth: "380px" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search clients by name, store, WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
          {filtered.length} {filtered.length === 1 ? "client" : "clients"} registered
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client / Business</th>
              <th>WhatsApp / Contact</th>
              <th>Connected Store</th>
              <th>Active Plan</th>
              <th>Total Billed</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Orders</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                  Connecting to clients database...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <Users size={36} />
                    <span className="empty-state-title">No clients found</span>
                    <span className="empty-state-desc">
                      {search ? "No matching clients found" : "Clients will automatically appear as stores and orders are registered"}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((client) => {
                return (
                  <tr key={client.id} style={{ cursor: "pointer" }}>
                    <td>
                      <Link
                        href={`/clients/${client.id}`}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "inherit" }}
                      >
                        <div
                          className="avatar avatar-sm"
                          style={{
                            background: "var(--color-accent)",
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        >
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{client.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                            {client.business}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td>
                      {client.whatsapp ? (
                        <a
                          href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.8125rem",
                            fontFamily: "var(--font-mono)",
                            color: "#22c55e",
                            textDecoration: "none",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={12} />
                          {client.whatsapp}
                        </a>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>—</span>
                      )}
                    </td>
                    <td>
                      {client.store ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "4px",
                            padding: "0.15rem 0.45rem",
                            fontSize: "0.75rem",
                            fontFamily: "var(--font-mono)",
                            color: "var(--color-accent)",
                          }}
                        >
                          <StoreIcon size={12} />
                          /{client.store.slug}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>None</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                        {client.plans.join(", ") || "Starter"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                      PKR {client.totalBilled.toLocaleString()}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "#22c55e" }}>
                      PKR {client.totalPaid.toLocaleString()}
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                        color: client.totalDue > 0 ? "var(--color-status-danger)" : "inherit",
                        fontWeight: client.totalDue > 0 ? 700 : 400,
                      }}
                    >
                      PKR {client.totalDue.toLocaleString()}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                      <Link
                        href={`/clients/${client.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.725rem", padding: "0.2rem 0.5rem" }}
                      >
                        Profile ({client.orders.length})
                      </Link>
                    </td>
                    <td>
                      <span className={`status-badge ${client.status}`}>
                        <span className="status-badge-dot" />
                        {client.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
