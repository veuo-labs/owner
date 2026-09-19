"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchCrmActivities } from "@/lib/crm-store";
import { Activity as ActivityIcon, StickyNote, CreditCard, FolderKanban, Users, Plus } from "lucide-react";
import type { ActivityLogEntry, OwnerNote } from "@/lib/types";

const entityIcons: Record<string, React.ElementType> = {
  client: Users,
  project: FolderKanban,
  payment: CreditCard,
  store: ActivityIcon,
  milestone: ActivityIcon,
  system: ActivityIcon,
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [notes, setNotes] = useState<OwnerNote[]>([]);
  const [activeTab, setActiveTab] = useState("activity");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("zedwix:order_received", handler);
    return () => window.removeEventListener("zedwix:order_received", handler);
  }, []);

  async function loadData() {
    const actList = await fetchCrmActivities();
    setActivities(actList as any);
    setLoading(false);
  }

  async function handleAddNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const content = form.get("content") as string;
    if (!content.trim()) return;
    const supabase = createClient();
    await supabase.from("owner_notes").insert({ entity_type: "general", content: content.trim() });
    (e.target as HTMLFormElement).reset();
    loadData();
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>ACTIVITY & NOTES</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
          Track all activities and important notes.
        </p>
      </div>

      <div className="tab-list">
        {["activity", "notes"].map((tab) => (
          <button key={tab} className={`tab-trigger ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "activity" && (
        <div>
          {loading ? (
            <div style={{ padding: "2rem", color: "var(--color-text-muted)", textAlign: "center" }}>Loading...</div>
          ) : activities.length === 0 ? (
            <div className="empty-state" style={{ padding: "3rem" }}>
              <ActivityIcon size={32} />
              <span className="empty-state-title">No activity yet</span>
              <span className="empty-state-desc">Activities will appear here as you use the system.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {activities.map((a) => {
                const Icon = entityIcons[a.entity_type] || ActivityIcon;
                return (
                  <div key={a.id} className="metric-card" style={{ padding: "1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{ background: "var(--color-surface-alt)", borderRadius: "8px", padding: "0.5rem", flexShrink: 0 }}>
                      <Icon size={16} style={{ color: "var(--color-accent)" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>{a.description}</p>
                      <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                        <span>{new Date(a.created_at).toLocaleString()}</span>
                        <span>•</span>
                        <span>{a.actor}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div>
          <form onSubmit={handleAddNote} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <input className="form-input" name="content" placeholder="Add a quick note..." style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary btn-sm"><Plus size={14} /> Add Note</button>
          </form>
          {notes.length === 0 ? (
            <div className="empty-state">
              <StickyNote size={32} />
              <span className="empty-state-title">No notes yet</span>
              <span className="empty-state-desc">Add notes to keep track of important information.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {notes.map((n) => (
                <div key={n.id} className="metric-card" style={{ padding: "1rem" }}>
                  <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>{n.content}</p>
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    <span>•</span>
                    <span className={`status-badge info`} style={{ fontSize: "0.625rem" }}>{n.entity_type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
