import { createClient } from "@/lib/supabase/client";
import type { OwnerClient, OwnerProject, OwnerPayment, OwnerMilestone, ActivityLogEntry } from "@/lib/types";

export const CRM_CACHE_KEY = "zedwix_master_crm_v1";

function getLocalCache(): {
  clients: OwnerClient[];
  projects: OwnerProject[];
  payments: OwnerPayment[];
  activities: ActivityLogEntry[];
  milestones: OwnerMilestone[];
} {
  if (typeof window === "undefined") {
    return { clients: [], projects: [], payments: [], activities: [], milestones: [] };
  }
  try {
    const raw = localStorage.getItem(CRM_CACHE_KEY);
    if (!raw) return { clients: [], projects: [], payments: [], activities: [], milestones: [] };
    const parsed = JSON.parse(raw);
    return {
      clients: Array.isArray(parsed.clients) ? parsed.clients : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
    };
  } catch (e) {
    return { clients: [], projects: [], payments: [], activities: [], milestones: [] };
  }
}

function saveLocalCache(data: any) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalCache();
    const merged = { ...existing, ...data };
    localStorage.setItem(CRM_CACHE_KEY, JSON.stringify(merged));
  } catch (e) {}
}

export async function fetchCrmClients(): Promise<OwnerClient[]> {
  const supabase = createClient();
  const local = getLocalCache();

  try {
    const { data, error } = await supabase.from("owner_clients").select("*").order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      // Merge with local cache
      const map = new Map<string, OwnerClient>();
      data.forEach((c: any) => map.set(c.id, c));
      local.clients.forEach((c) => { if (!map.has(c.id)) map.set(c.id, c); });
      const merged = Array.from(map.values());
      saveLocalCache({ clients: merged });
      return merged;
    }
  } catch (e) {}

  return local.clients;
}

export async function fetchCrmProjects(): Promise<(OwnerProject & { client?: OwnerClient })[]> {
  const supabase = createClient();
  const local = getLocalCache();

  try {
    const { data, error } = await supabase
      .from("owner_projects")
      .select("*, client:owner_clients(id, name, company)")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const map = new Map<string, any>();
      data.forEach((p: any) => map.set(p.id, p));
      local.projects.forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
      const merged = Array.from(map.values());
      saveLocalCache({ projects: merged });
      return merged;
    }
  } catch (e) {}

  // Populate client object from local clients
  const clientMap = new Map(local.clients.map((c) => [c.id, c]));
  return local.projects.map((p) => ({
    ...p,
    client: clientMap.get(p.client_id) || { id: p.client_id, name: "Client", company: "" } as any,
  }));
}

export async function fetchCrmPayments(): Promise<(OwnerPayment & { client?: { name: string }; project?: { name: string } | null })[]> {
  const supabase = createClient();
  const local = getLocalCache();

  try {
    const { data, error } = await supabase
      .from("owner_payments")
      .select("*, client:owner_clients(name), project:owner_projects(name)")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const map = new Map<string, any>();
      data.forEach((p: any) => map.set(p.id, p));
      local.payments.forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
      const merged = Array.from(map.values());
      saveLocalCache({ payments: merged });
      return merged;
    }
  } catch (e) {}

  const clientMap = new Map(local.clients.map((c) => [c.id, c.name]));
  const projectMap = new Map(local.projects.map((p) => [p.id, p.name]));
  return local.payments.map((pay) => ({
    ...pay,
    client: { name: clientMap.get(pay.client_id) || "Client" },
    project: pay.project_id ? { name: projectMap.get(pay.project_id) || "Project" } : null,
  })) as any;
}

export async function fetchCrmActivities(): Promise<ActivityLogEntry[]> {
  const supabase = createClient();
  const local = getLocalCache();

  try {
    const { data, error } = await supabase
      .from("owner_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {}

  return local.activities;
}
