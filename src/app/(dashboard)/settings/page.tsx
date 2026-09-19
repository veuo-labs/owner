"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Settings as SettingsIcon, Plus, Trash2, KeyRound, Store, Sun, Moon } from "lucide-react";
import type { StoreRecord } from "@/lib/types";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<StoreRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => { loadStores(); }, []);

  async function loadStores() {
    try {
      const res = await fetch("/api/stores");
      const data = await res.json();
      if (data.success) setStores(data.stores || []);
    } catch (err) {
      console.error("Load stores error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionLoading(true);
    setActionMsg("");
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_store",
          name: form.get("name"),
          slug: form.get("slug"),
          email: form.get("email"),
          password: form.get("password"),
          whatsappNumber: form.get("whatsapp") || null,
          contactNumber: form.get("contact") || null,
          instagramUrl: form.get("instagram") || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowStoreModal(false);
        setActionMsg("Store created successfully!");
        loadStores();
      } else {
        setActionMsg(data.error || "Failed to create store");
      }
    } catch (err) {
      setActionMsg("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteStore(storeId: string) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/stores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteConfirm(null);
        setActionMsg("Store deleted.");
        loadStores();
      } else {
        setActionMsg(data.error || "Failed to delete store");
      }
    } catch (err) {
      setActionMsg("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!showResetModal) return;
    setActionLoading(true);
    const form = new FormData(e.currentTarget);
    const newPassword = form.get("password") as string;

    try {
      const res = await fetch(`/api/stores/${showResetModal.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setShowResetModal(null);
        setActionMsg("Password reset successfully!");
      } else {
        setActionMsg(data.error || "Failed to reset password");
      }
    } catch (err) {
      setActionMsg("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  function generateSlug(name: string) {
    return name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function generatePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 14; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>SETTINGS</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
          Manage your account and application preferences.
        </p>
      </div>

      {actionMsg && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            background: actionMsg.includes("error") || actionMsg.includes("Failed") ? "var(--color-status-danger-bg)" : "var(--color-status-active-bg)",
            color: actionMsg.includes("error") || actionMsg.includes("Failed") ? "var(--color-status-danger)" : "var(--color-status-active)",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {actionMsg}
        </div>
      )}

      {/* Profile Section */}
      <div className="metric-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Profile Information</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div><label className="form-label">Name</label><input className="form-input" defaultValue="Zain Ul Abidin" /></div>
          <div><label className="form-label">Email</label><input className="form-input" defaultValue="" placeholder="your@email.com" /></div>
          <div><label className="form-label">Phone</label><input className="form-input" defaultValue="" placeholder="+92..." /></div>
          <div><label className="form-label">Address</label><input className="form-input" defaultValue="" placeholder="City, Country" /></div>
        </div>
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="metric-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Appearance</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
              Current: {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            Switch to {theme === "dark" ? "Light" : "Dark"} Mode
          </button>
        </div>
      </div>

      {/* Store Management */}
      <div className="metric-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Store Management</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
              Add, delete, or reset passwords for client stores.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowStoreModal(true)}>
            <Plus size={14} /> Add Store
          </button>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Store Name</th><th>Slug</th><th>Owner Email</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>Loading...</td></tr>
              ) : stores.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><Store size={24} /><span className="empty-state-desc">No stores found</span></div></td></tr>
              ) : (
                stores.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent)" }}>/{s.slug}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>{s.ownerEmail || "—"}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                      {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-ghost btn-sm" title="Reset Password" onClick={() => setShowResetModal(s)}>
                          <KeyRound size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" title="Delete Store" style={{ color: "var(--color-status-danger)" }} onClick={() => setShowDeleteConfirm(s.id)}>
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
      </div>

      {/* Create Store Modal */}
      {showStoreModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowStoreModal(false); }}>
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Create New Store</h2>
              <button className="btn-ghost" onClick={() => setShowStoreModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateStore} id="createStoreForm">
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label className="form-label">Store Name *</label>
                  <input className="form-input" name="name" required placeholder="Brand Name" onChange={(e) => {
                    const slugInput = document.querySelector<HTMLInputElement>('#createStoreForm input[name="slug"]');
                    if (slugInput) slugInput.value = generateSlug(e.target.value);
                  }} />
                </div>
                <div>
                  <label className="form-label">Slug (URL Path) *</label>
                  <input className="form-input" name="slug" required placeholder="brand-name" style={{ fontFamily: "var(--font-mono)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label className="form-label">Client Email *</label><input className="form-input" name="email" type="email" required placeholder="client@email.com" /></div>
                  <div>
                    <label className="form-label">Password *</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input className="form-input" name="password" required placeholder="••••••••" style={{ flex: 1 }} id="pwField" />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                        const el = document.getElementById("pwField") as HTMLInputElement;
                        if (el) el.value = generatePassword();
                      }}>Generate</button>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label className="form-label">WhatsApp</label><input className="form-input" name="whatsapp" placeholder="+92..." /></div>
                  <div><label className="form-label">Contact</label><input className="form-input" name="contact" placeholder="+92..." /></div>
                </div>
                <div><label className="form-label">Instagram</label><input className="form-input" name="instagram" placeholder="@handle" /></div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStoreModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Creating..." : "Create Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(null); }}>
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div style={{ textAlign: "center", padding: "1rem" }}>
              <Trash2 size={40} style={{ color: "var(--color-status-danger)", marginBottom: "1rem" }} />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Delete Store?</h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                This will permanently delete the store, all its products, images, and the client login account. This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" disabled={actionLoading} onClick={() => handleDeleteStore(showDeleteConfirm)}>
                  {actionLoading ? "Deleting..." : "Delete Store"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(null); }}>
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Reset Password</h2>
              <button className="btn-ghost" onClick={() => setShowResetModal(null)}>✕</button>
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Reset the login password for <strong>{showResetModal.name}</strong> ({showResetModal.ownerEmail}).
            </p>
            <form onSubmit={handleResetPassword}>
              <div>
                <label className="form-label">New Password *</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input className="form-input" name="password" required minLength={6} placeholder="New password" style={{ flex: 1 }} id="resetPwField" />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                    const el = document.getElementById("resetPwField") as HTMLInputElement;
                    if (el) el.value = generatePassword();
                  }}>Generate</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
