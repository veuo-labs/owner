"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchCrmProjects, fetchCrmClients } from "@/lib/crm-store";
import { FolderKanban, Plus, Search } from "lucide-react";
import Link from "next/link";
import type { OwnerProject, OwnerClient } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<(OwnerProject & { client?: OwnerClient })[]>([]);
  const [clients, setClients] = useState<Pick<OwnerClient, "id" | "name" | "company">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("zedwix:order_received", handler);
    return () => window.removeEventListener("zedwix:order_received", handler);
  }, []);

  async function loadData() {
    const [projs, clis] = await Promise.all([
      fetchCrmProjects(),
      fetchCrmClients(),
    ]);
    setProjects(projs as any);
    setClients(clis as any);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const totalAmount = Number(form.get("total_amount")) || 0;

    await supabase.from("owner_projects").insert({
      client_id: form.get("client_id") as string,
      name: form.get("name") as string,
      description: (form.get("description") as string) || null,
      status: "pending",
      start_date: (form.get("start_date") as string) || null,
      deadline: (form.get("deadline") as string) || null,
      total_amount: totalAmount,
      due_amount: totalAmount,
    });

    setShowModal(false);
    loadData();
  }

  const statuses = ["all", "in_progress", "completed", "pending", "on_hold"];
  const statusLabels: Record<string, string> = {
    all: "All Statuses",
    in_progress: "In Progress",
    completed: "Completed",
    pending: "Pending",
    on_hold: "On Hold",
  };

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.client as any)?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>PROJECTS</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Track all your projects and their progress.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div className="topbar-search" style={{ maxWidth: "300px" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {statuses.map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter(s)}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Deadline</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <FolderKanban size={32} />
                    <span className="empty-state-title">No projects found</span>
                    <span className="empty-state-desc">{search || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first project"}</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/projects/${p.id}`} style={{ fontWeight: 600, color: "var(--color-accent)", textDecoration: "none" }}>
                      {p.name}
                    </Link>
                  </td>
                  <td>{(p.client as any)?.name || "—"}</td>
                  <td>
                    <span className={`status-badge ${p.status}`}>
                      <span className="status-badge-dot" />
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                    {p.start_date ? new Date(p.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                    {p.deadline ? new Date(p.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>Rs. {Number(p.total_amount).toLocaleString()}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--color-status-active)" }}>Rs. {Number(p.paid_amount).toLocaleString()}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: Number(p.due_amount) > 0 ? "var(--color-status-danger)" : "inherit" }}>
                    Rs. {Number(p.due_amount).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="pagination">
            <span>Showing 1-{filtered.length} of {filtered.length} projects</span>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>New Project</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label className="form-label">Client *</label>
                  <select className="form-input form-select" name="client_id" required>
                    <option value="">Select client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
                    ))}
                  </select>
                </div>
                <div><label className="form-label">Project Name *</label><input className="form-input" name="name" required placeholder="Website Redesign" /></div>
                <div><label className="form-label">Description</label><textarea className="form-input" name="description" rows={3} placeholder="Brief project description..." /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label className="form-label">Start Date</label><input className="form-input" name="start_date" type="date" /></div>
                  <div><label className="form-label">Deadline</label><input className="form-input" name="deadline" type="date" /></div>
                </div>
                <div><label className="form-label">Total Amount (Rs.)</label><input className="form-input" name="total_amount" type="number" placeholder="0" /></div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={14} /> Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
