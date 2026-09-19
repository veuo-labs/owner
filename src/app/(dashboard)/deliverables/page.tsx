"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClipboardList, Search } from "lucide-react";
import type { OwnerMilestone } from "@/lib/types";

export default function DeliverablesPage() {
  const [milestones, setMilestones] = useState<(OwnerMilestone & { project?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const [msRes, projRes] = await Promise.all([
      supabase.from("owner_milestones").select("*, project:owner_projects(name)").order("due_date", { ascending: true }),
      supabase.from("owner_projects").select("id, name").order("name"),
    ]);
    setMilestones((msRes.data || []) as any);
    setProjects(projRes.data || []);
    setLoading(false);
  }

  const statuses = ["all", "completed", "in_progress", "pending"];
  const statusLabels: Record<string, string> = { all: "All Statuses", completed: "Completed", in_progress: "In Progress", pending: "Pending" };

  const filtered = milestones.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (projectFilter !== "all" && m.project_id !== projectFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.title.toLowerCase().includes(q) || (m.project as any)?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>TASKS & DELIVERABLES</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
          Track all deliverables across projects.
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div className="topbar-search" style={{ maxWidth: "300px" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input placeholder="Search deliverables..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-input form-select" style={{ width: "180px" }} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="all">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {statuses.map((s) => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-secondary"}`} onClick={() => setStatusFilter(s)}>
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead><tr><th>Deliverable</th><th>Project</th><th>Due Date</th><th>Status</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4}><div className="empty-state"><ClipboardList size={32} /><span className="empty-state-title">No deliverables found</span><span className="empty-state-desc">Add deliverables from within a project</span></div></td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 500 }}>{m.title}</td>
                  <td>{(m.project as any)?.name || "—"}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                    {m.due_date ? new Date(m.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td>
                    <span className={`status-badge ${m.status}`}>
                      <span className="status-badge-dot" />
                      {statusLabels[m.status] || m.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && <div className="pagination"><span>Showing 1-{filtered.length} of {filtered.length} deliverables</span></div>}
      </div>
    </div>
  );
}
