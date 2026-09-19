"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, Edit2 } from "lucide-react";
import Link from "next/link";
import type { OwnerProject, OwnerMilestone, OwnerPayment, OwnerNote } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<OwnerProject & { client?: { name: string; company: string | null } } | null>(null);
  const [milestones, setMilestones] = useState<OwnerMilestone[]>([]);
  const [payments, setPayments] = useState<OwnerPayment[]>([]);
  const [notes, setNotes] = useState<OwnerNote[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    const supabase = createClient();
    const [projRes, msRes, payRes, notesRes] = await Promise.all([
      supabase.from("owner_projects").select("*, client:owner_clients(name, company)").eq("id", projectId).single(),
      supabase.from("owner_milestones").select("*").eq("project_id", projectId).order("due_date", { ascending: true }),
      supabase.from("owner_payments").select("*").eq("project_id", projectId).order("date", { ascending: false }),
      supabase.from("owner_notes").select("*").eq("entity_type", "project").eq("entity_id", projectId).order("created_at", { ascending: false }),
    ]);
    setProject(projRes.data as any);
    setMilestones(msRes.data || []);
    setPayments(payRes.data || []);
    setNotes(notesRes.data || []);
    setLoading(false);
  }

  async function handleAddMilestone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    await supabase.from("owner_milestones").insert({
      project_id: projectId,
      title: form.get("title") as string,
      due_date: (form.get("due_date") as string) || null,
      status: "pending",
    });
    setShowMilestoneModal(false);
    loadProject();
  }

  async function toggleMilestoneStatus(ms: OwnerMilestone) {
    const supabase = createClient();
    const nextStatus = ms.status === "completed" ? "pending" : ms.status === "in_progress" ? "completed" : "in_progress";
    await supabase.from("owner_milestones").update({
      status: nextStatus,
      completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
    }).eq("id", ms.id);
    loadProject();
  }

  async function handleEditProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    await supabase.from("owner_projects").update({
      name: form.get("name") as string,
      description: (form.get("description") as string) || null,
      status: form.get("status") as string,
      start_date: (form.get("start_date") as string) || null,
      deadline: (form.get("deadline") as string) || null,
      total_amount: Number(form.get("total_amount")) || 0,
    }).eq("id", projectId);
    setShowEditModal(false);
    loadProject();
  }

  async function handleAddNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const content = form.get("content") as string;
    if (!content.trim()) return;
    await supabase.from("owner_notes").insert({ entity_type: "project", entity_id: projectId, content: content.trim() });
    (e.target as HTMLFormElement).reset();
    loadProject();
  }

  if (loading) return <div style={{ padding: "2rem", color: "var(--color-text-muted)" }}>Loading...</div>;
  if (!project) return <div style={{ padding: "2rem", color: "var(--color-text-muted)" }}>Project not found.</div>;

  const statusLabels: Record<string, string> = { pending: "Pending", in_progress: "In Progress", completed: "Completed", on_hold: "On Hold" };

  return (
    <div>
      <Link href="/projects" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      {/* Project Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{project.name}</h1>
            <span className={`status-badge ${project.status}`}><span className="status-badge-dot" />{statusLabels[project.status]}</span>
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Client: <Link href={`/clients/${project.client_id}`} style={{ color: "var(--color-accent)", textDecoration: "none" }}>{(project.client as any)?.name || "—"}</Link>
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>
          <Edit2 size={14} /> Edit Project
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-list">
        {["overview", "milestones", "notes"].map((tab) => (
          <button key={tab} className={`tab-trigger ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab === "milestones" ? "Milestones / Deliverables" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="metric-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>Project Overview</h3>
            {project.description && <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>{project.description}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Start Date</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{project.start_date ? new Date(project.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Deadline</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{project.deadline ? new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
              </div>
            </div>
          </div>
          <div className="metric-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>Payment Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Total Amount</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>Rs. {Number(project.total_amount).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Paid</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-status-active)" }}>Rs. {Number(project.paid_amount).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem" }}>
                <span style={{ fontWeight: 600 }}>Due</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: Number(project.due_amount) > 0 ? "var(--color-status-danger)" : "inherit" }}>
                  Rs. {Number(project.due_amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestones */}
      {activeTab === "milestones" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowMilestoneModal(true)}>
              <Plus size={14} /> Add Deliverable
            </button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Deliverable</th><th>Due Date</th><th>Status</th><th>Completed</th><th>Action</th></tr></thead>
              <tbody>
                {milestones.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><span className="empty-state-desc">No deliverables yet</span></div></td></tr>
                ) : (
                  milestones.map((ms) => (
                    <tr key={ms.id}>
                      <td style={{ fontWeight: 500 }}>{ms.title}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                        {ms.due_date ? new Date(ms.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td><span className={`status-badge ${ms.status}`}><span className="status-badge-dot" />{statusLabels[ms.status] || ms.status.replace("_", " ")}</span></td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                        {ms.completed_at ? new Date(ms.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => toggleMilestoneStatus(ms)}>
                          {ms.status === "completed" ? "Reopen" : ms.status === "in_progress" ? "Complete" : "Start"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {activeTab === "notes" && (
        <div>
          <form onSubmit={handleAddNote} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <input className="form-input" name="content" placeholder="Add a note..." style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary btn-sm">Add Note</button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {notes.length === 0 ? (
              <div className="empty-state"><span className="empty-state-desc">No notes yet</span></div>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="metric-card" style={{ padding: "1rem" }}>
                  <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>{n.content}</p>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowMilestoneModal(false); }}>
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Add Deliverable</h2>
              <button className="btn-ghost" onClick={() => setShowMilestoneModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddMilestone}>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div><label className="form-label">Title *</label><input className="form-input" name="title" required placeholder="Homepage Design" /></div>
                <div><label className="form-label">Due Date</label><input className="form-input" name="due_date" type="date" /></div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMilestoneModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={14} /> Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Edit Project</h2>
              <button className="btn-ghost" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditProject}>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div><label className="form-label">Project Name *</label><input className="form-input" name="name" required defaultValue={project.name} /></div>
                <div><label className="form-label">Description</label><textarea className="form-input" name="description" rows={3} defaultValue={project.description || ""} /></div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input form-select" name="status" defaultValue={project.status}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label className="form-label">Start Date</label><input className="form-input" name="start_date" type="date" defaultValue={project.start_date || ""} /></div>
                  <div><label className="form-label">Deadline</label><input className="form-input" name="deadline" type="date" defaultValue={project.deadline || ""} /></div>
                </div>
                <div><label className="form-label">Total Amount (Rs.)</label><input className="form-input" name="total_amount" type="number" defaultValue={project.total_amount} /></div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
