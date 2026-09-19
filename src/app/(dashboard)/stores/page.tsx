"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Plus,
  Trash2,
  KeyRound,
  ExternalLink,
  Search,
  Check,
  Copy,
  Edit2,
  Phone,
  Instagram,
  Package,
} from "lucide-react";
import type { StoreListItem } from "@/lib/types";

export default function StoresPage() {
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<StoreListItem | null>(null);
  const [showResetModal, setShowResetModal] = useState<StoreListItem | null>(null);
  const [showEditModal, setShowEditModal] = useState<StoreListItem | null>(null);

  // Created credentials popup
  const [createdCredentials, setCreatedCredentials] = useState<{
    storeName: string;
    slug: string;
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create form inputs
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createWhatsapp, setCreateWhatsapp] = useState("");
  const [createContact, setCreateContact] = useState("");
  const [createInstagram, setCreateInstagram] = useState("");

  // Edit form inputs
  const [editName, setEditName] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editInstagram, setEditInstagram] = useState("");

  // Reset password input
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    try {
      setLoading(true);
      const res = await fetch("/api/stores");
      const data = await res.json();
      if (data.success && data.stores) {
        setStores(data.stores);
      }
    } catch (err) {
      console.error("Failed to load stores:", err);
    } finally {
      setLoading(false);
    }
  }

  function generateRandomPassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  function handleOpenCreate() {
    setCreateName("");
    setCreateSlug("");
    setCreateEmail("");
    setCreatePassword(generateRandomPassword());
    setCreateWhatsapp("");
    setCreateContact("");
    setCreateInstagram("");
    setShowCreateModal(true);
    setFeedback(null);
  }

  function handleNameChange(val: string) {
    setCreateName(val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setCreateSlug(slug);
  }

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          slug: createSlug,
          email: createEmail,
          password: createPassword,
          whatsappNumber: createWhatsapp || null,
          contactNumber: createContact || null,
          instagramUrl: createInstagram || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setCreatedCredentials(data.credentials);
        setFeedback({ type: "success", text: `Store "${createName}" created successfully!` });
        loadStores();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to create store." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Network error occurred." });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteStore() {
    if (!showDeleteModal) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/stores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: showDeleteModal.id }),
      });

      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(null);
        setFeedback({ type: "success", text: `Store "${showDeleteModal.name}" deleted permanently.` });
        loadStores();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to delete store." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  function handleOpenEdit(store: StoreListItem) {
    setShowEditModal(store);
    setEditName(store.name);
    setEditWhatsapp(store.whatsapp_number || "");
    setEditContact(store.contact_number || "");
    setEditInstagram(store.instagram_url || "");
  }

  async function handleUpdateStore(e: React.FormEvent) {
    e.preventDefault();
    if (!showEditModal) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/stores/${showEditModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          whatsappNumber: editWhatsapp || null,
          contactNumber: editContact || null,
          instagramUrl: editInstagram || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowEditModal(null);
        setFeedback({ type: "success", text: "Store details updated successfully." });
        loadStores();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to update store." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  function handleOpenReset(store: StoreListItem) {
    setShowResetModal(store);
    setNewPassword(generateRandomPassword());
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!showResetModal) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/stores/${showResetModal.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (data.success) {
        const creds = {
          storeName: showResetModal.name,
          slug: showResetModal.slug,
          email: showResetModal.ownerEmail || "Client Account",
          password: newPassword,
        };
        setShowResetModal(null);
        setCreatedCredentials(creds);
        setFeedback({ type: "success", text: "Client password updated successfully." });
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to reset password." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  function copyCredentialsText() {
    if (!createdCredentials) return;
    const text = `*ZEDWIX STORE CREDENTIALS*\nStore: ${createdCredentials.storeName}\nURL: https://zedwix.com/${createdCredentials.slug}\n\nLogin Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nSign in to manage your catalogue, stock, and orders.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const filteredStores = stores.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      (s.ownerEmail || "").toLowerCase().includes(q) ||
      (s.whatsapp_number || "").includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>STORES</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Operational client storefronts powered by Zedwix Engine.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} />
          Create New Store
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.25rem",
            background: feedback.type === "error" ? "var(--color-status-danger-bg)" : "var(--color-status-active-bg)",
            color: feedback.type === "error" ? "var(--color-status-danger)" : "var(--color-status-active)",
            fontSize: "0.875rem",
            fontWeight: 500,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{feedback.text}</span>
          <button className="btn-ghost" onClick={() => setFeedback(null)} style={{ padding: "0 0.25rem" }}>
            ✕
          </button>
        </div>
      )}

      {/* Search & Counter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div className="topbar-search" style={{ width: "100%", maxWidth: "360px" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search stores by name, slug, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
          {filteredStores.length} {filteredStores.length === 1 ? "store" : "stores"} active
        </div>
      </div>

      {/* Stores Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Store Details</th>
              <th>Live Slug</th>
              <th>Owner / Credentials</th>
              <th>Contact / WhatsApp</th>
              <th>Products</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                  Loading stores from Supabase...
                </td>
              </tr>
            ) : filteredStores.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <Store size={36} />
                    <span className="empty-state-title">No stores found</span>
                    <span className="empty-state-desc">
                      {search ? "No stores matching your search query" : "Click 'Create New Store' to deploy your first client storefront"}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStores.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--color-accent)",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          flexShrink: 0,
                        }}
                      >
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{s.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                          ID: {s.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.8125rem",
                          color: "var(--color-accent)",
                          background: "var(--color-surface)",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "4px",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        /{s.slug}
                      </span>
                      <a
                        href={`https://${s.slug}.pages.dev`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost"
                        style={{ padding: "0.2rem", color: "var(--color-text-muted)" }}
                        title="Open live storefront"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </td>
                  <td>
                    {s.ownerEmail ? (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--color-text)" }}>
                        {s.ownerEmail}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>No login user linked</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      {s.whatsapp_number ? (
                        <a
                          href={`https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.75rem",
                            fontFamily: "var(--font-mono)",
                            color: "#22c55e",
                            textDecoration: "none",
                          }}
                        >
                          <Phone size={12} /> {s.whatsapp_number}
                        </a>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>No WhatsApp</span>
                      )}
                      {s.instagram_url && (
                        <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>
                          {s.instagram_url}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>
                      <Package size={14} style={{ color: "var(--color-text-muted)" }} />
                      <span>{s.productCount || 0}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {new Date(s.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Edit store info"
                        onClick={() => handleOpenEdit(s)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Reset client login password"
                        onClick={() => handleOpenReset(s)}
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--color-status-danger)" }}
                        title="Delete store"
                        onClick={() => setShowDeleteModal(s)}
                        disabled={s.id === "00000000-0000-0000-0000-000000000001"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE STORE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="modal-content" style={{ maxWidth: "540px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Create New Client Store</h2>
              <button className="btn-ghost" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateStore}>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label className="form-label">Store / Brand Name *</label>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g. Royal Apparel"
                    value={createName}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Storefront Slug (URL Subpath) *</label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ padding: "0.5rem 0.75rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRight: "none", borderRadius: "8px 0 0 8px", fontSize: "0.8125rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                      zedwix.com/
                    </span>
                    <input
                      className="form-input"
                      required
                      style={{ borderRadius: "0 8px 8px 0", fontFamily: "var(--font-mono)" }}
                      value={createSlug}
                      onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="form-label">Client Login Email *</label>
                    <input
                      className="form-input"
                      type="email"
                      required
                      placeholder="client@brand.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <label className="form-label">Passcode *</label>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ fontSize: "0.725rem", color: "var(--color-accent)", padding: 0 }}
                        onClick={() => setCreatePassword(generateRandomPassword())}
                      >
                        Generate
                      </button>
                    </div>
                    <input
                      className="form-input"
                      required
                      style={{ fontFamily: "var(--font-mono)" }}
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="form-label">WhatsApp Number</label>
                    <input
                      className="form-input"
                      placeholder="03211234567"
                      value={createWhatsapp}
                      onChange={(e) => setCreateWhatsapp(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Contact Number</label>
                    <input
                      className="form-input"
                      placeholder="03211234567"
                      value={createContact}
                      onChange={(e) => setCreateContact(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Instagram Handle / URL</label>
                  <input
                    className="form-input"
                    placeholder="@brandhandle"
                    value={createInstagram}
                    onChange={(e) => setCreateInstagram(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Provisioning..." : "Deploy Store & Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATED CREDENTIALS MODAL */}
      {createdCredentials && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCreatedCredentials(null); }}>
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "0.35rem", borderRadius: "50%" }}>
                  <Check size={18} />
                </span>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Store Account Ready</h3>
              </div>
              <button className="btn-ghost" onClick={() => setCreatedCredentials(null)}>✕</button>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
              Copy these credentials and share them with the client via WhatsApp so they can access their store dashboard.
            </p>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem", lineHeight: "1.7", marginBottom: "1.25rem" }}>
              <div><strong>Store:</strong> {createdCredentials.storeName}</div>
              <div><strong>Storefront:</strong> /{createdCredentials.slug}</div>
              <div style={{ borderTop: "1px solid var(--color-border)", margin: "0.5rem 0", paddingTop: "0.5rem" }}>
                <div><strong>Login Email:</strong> <span style={{ color: "var(--color-accent)" }}>{createdCredentials.email}</span></div>
                <div><strong>Password:</strong> <span style={{ color: "#22c55e", fontWeight: 700 }}>{createdCredentials.password}</span></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setCreatedCredentials(null)}>
                Dismiss
              </button>
              <button className="btn btn-primary" onClick={copyCredentialsText}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied to Clipboard!" : "Copy for WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STORE MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(null); }}>
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Edit Store Details</h2>
              <button className="btn-ghost" onClick={() => setShowEditModal(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateStore}>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label className="form-label">Store Name</label>
                  <input className="form-input" required value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">WhatsApp Number</label>
                  <input className="form-input" placeholder="0321..." value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Contact Number</label>
                  <input className="form-input" placeholder="0321..." value={editContact} onChange={(e) => setEditContact(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Instagram</label>
                  <input className="form-input" placeholder="@brand" value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(null); }}>
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Reset Client Password</h2>
              <button className="btn-ghost" onClick={() => setShowResetModal(null)}>✕</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
              Update credentials for <strong>{showResetModal.name}</strong> ({showResetModal.ownerEmail || "Client Account"}).
            </p>
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.35rem" }}>
                  <label className="form-label" style={{ margin: 0 }}>New Passcode</label>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: "0.725rem", color: "var(--color-accent)", padding: 0 }}
                    onClick={() => setNewPassword(generateRandomPassword())}
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  className="form-input"
                  required
                  style={{ fontFamily: "var(--font-mono)" }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE STORE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(null); }}>
          <div className="modal-content" style={{ maxWidth: "420px", textAlign: "center" }}>
            <Trash2 size={40} style={{ color: "var(--color-status-danger)", margin: "0 auto 1rem" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Delete Store?</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
              Are you sure you want to permanently delete <strong>{showDeleteModal.name}</strong> (/{showDeleteModal.slug})? All products, categories, and the client login account will be removed.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={actionLoading} onClick={handleDeleteStore}>
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
