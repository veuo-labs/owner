"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchCrmPayments, fetchCrmClients, fetchCrmProjects } from "@/lib/crm-store";
import { CreditCard, Plus, Search, Check, Copy, Printer, Eye, ShieldCheck, AlertCircle, FileText } from "lucide-react";
import type { OwnerPayment, OwnerClient, OwnerProject } from "@/lib/types";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<(OwnerPayment & { client?: { name: string }; project?: { name: string } | null })[]>([]);
  const [clients, setClients] = useState<Pick<OwnerClient, "id" | "name">[]>([]);
  const [projects, setProjects] = useState<Pick<OwnerProject, "id" | "name" | "client_id">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showReceiptLightbox, setShowReceiptLightbox] = useState(false);
  const [showAgreementSlip, setShowAgreementSlip] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyReference, setVerifyReference] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("zedwix:order_received", handler);
    return () => window.removeEventListener("zedwix:order_received", handler);
  }, []);

  async function loadData() {
    const [pays, clis, projs] = await Promise.all([
      fetchCrmPayments(),
      fetchCrmClients(),
      fetchCrmProjects(),
    ]);
    setPayments(pays as any);
    setClients(clis as any);
    setProjects(projs as any);
    setLoading(false);
  }

  async function handleRecordPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const clientId = form.get("client_id") as string;
    const projectId = (form.get("project_id") as string) || null;
    const amount = Number(form.get("amount"));

    const count = payments.length + 1;
    const invoiceNumber = `INV-${String(count).padStart(3, "0")}`;

    await supabase.from("owner_payments").insert({
      client_id: clientId,
      project_id: projectId,
      invoice_number: invoiceNumber,
      amount,
      method: form.get("method") as string,
      date: form.get("date") as string || new Date().toISOString().split("T")[0],
      status: form.get("status") as string || "paid",
      transaction_id: (form.get("transaction_id") as string) || null,
      notes: (form.get("notes") as string) || null,
    });

    const { data: cl } = await supabase.from("owner_clients").select("total_paid, total_due").eq("id", clientId).single();
    if (cl) {
      await supabase.from("owner_clients").update({
        total_paid: Number(cl.total_paid) + amount,
        total_due: Math.max(0, Number(cl.total_due) - amount),
        last_activity: new Date().toISOString(),
      }).eq("id", clientId);
    }

    if (projectId) {
      const { data: proj } = await supabase.from("owner_projects").select("paid_amount, due_amount").eq("id", projectId).single();
      if (proj) {
        await supabase.from("owner_projects").update({
          paid_amount: Number(proj.paid_amount) + amount,
          due_amount: Math.max(0, Number(proj.due_amount) - amount),
        }).eq("id", projectId);
      }
    }

    setShowModal(false);
    loadData();
  }

  async function handleVerifyPayment() {
    if (!selectedPayment || !verifyReference.trim()) return;
    setActionLoading(true);
    try {
      const supabase = createClient();
      const amount = Number(selectedPayment.amount);
      await supabase.from("owner_payments").update({
        status: "paid",
        transaction_id: verifyReference.trim(),
        notes: `Payment verified & activated via Owner Panel (Ref: ${verifyReference.trim()})`,
      }).eq("id", selectedPayment.id);

      const { data: cl } = await supabase.from("owner_clients").select("total_paid, total_due").eq("id", selectedPayment.client_id).single();
      if (cl) {
        await supabase.from("owner_clients").update({
          total_paid: Number(cl.total_paid) + amount,
          total_due: Math.max(0, Number(cl.total_due) - amount),
          last_activity: new Date().toISOString(),
        }).eq("id", selectedPayment.client_id);
      }

      alert(`Payment verified! ${selectedPayment.invoice_number} is now activated.`);
      setShowVerifyModal(false);
      setSelectedPayment(null);
      setVerifyReference("");
      loadData();
    } catch (err: any) {
      alert("Error verifying payment: " + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  function copyAgreementToClipboard() {
    if (!selectedPayment) return;
    const text = `ZEDWIX ENGINE — PAYMENT AGREEMENT SLIP\nInvoice: ${selectedPayment.invoice_number}\nClient: ${(selectedPayment.client as any)?.name || "—"}\nAmount: PKR ${Number(selectedPayment.amount).toLocaleString()}\nMethod: ${(selectedPayment.method || "").replace(/_/g, " ")}\nStatus: ${selectedPayment.status}\nTransaction ID: ${selectedPayment.transaction_id || "—"}\nDate: ${new Date(selectedPayment.date).toLocaleDateString("en-GB")}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const methodLabels: Record<string, string> = { bank_transfer: "Bank Transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa", sadapay: "SadaPay", cash: "Cash", other: "Other" };

  const filtered = payments.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.invoice_number.toLowerCase().includes(q) || (p.client as any)?.name?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>PAYMENTS & INVOICES</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Track all payments, verify transactions, and generate agreement slips.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Record Payment
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div className="topbar-search" style={{ maxWidth: "400px" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {["ALL", "paid", "pending", "overdue"].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: "0.75rem", textTransform: "capitalize" }}
              onClick={() => setStatusFilter(st)}
            >
              {st === "ALL" ? "All Statuses" : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Invoice #</th><th>Client</th><th>Project</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Transaction</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9}><div className="empty-state"><CreditCard size={32} /><span className="empty-state-title">No payments found</span><span className="empty-state-desc">Record your first payment</span></div></td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => setSelectedPayment(p)}>
                  <td style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{p.invoice_number}</td>
                  <td>{(p.client as any)?.name || "—"}</td>
                  <td>{(p.project as any)?.name || "—"}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>Rs. {Number(p.amount).toLocaleString()}</td>
                  <td>{methodLabels[p.method] || p.method}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                    {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td><span className={`status-badge ${p.status}`}><span className="status-badge-dot" />{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{p.transaction_id || "—"}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {p.status === "pending" && (
                      <button className="btn btn-primary btn-sm" onClick={() => { setSelectedPayment(p); setShowVerifyModal(true); }}>
                        <ShieldCheck size={12} /> Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && <div className="pagination"><span>Showing 1-{filtered.length} of {filtered.length} payments</span></div>}
      </div>

      {/* PAYMENT DETAIL MODAL */}
      {selectedPayment && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setSelectedPayment(null); setShowReceiptLightbox(false); setShowAgreementSlip(false); setShowVerifyModal(false); } }}>
          <div className="modal-content" style={{ maxWidth: "620px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Payment Details</h2>
              <button className="btn-ghost" onClick={() => { setSelectedPayment(null); setShowReceiptLightbox(false); setShowAgreementSlip(false); setShowVerifyModal(false); }}>✕</button>
            </div>

            <div style={{ display: "grid", gap: "0.75rem", fontSize: "0.875rem", padding: "0.75rem", background: "var(--color-accent)", borderRadius: "8px", color: "#fff", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700 }}>{selectedPayment.invoice_number}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.125rem" }}>Rs. {Number(selectedPayment.amount).toLocaleString()}</span>
              </div>
            </div>

            {[
              ["Client", (selectedPayment.client as any)?.name || "—"],
              ["Project", (selectedPayment.project as any)?.name || "—"],
              ["Method", methodLabels[selectedPayment.method]],
              ["Date", new Date(selectedPayment.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
              ["Status", selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)],
              ["Transaction ID", selectedPayment.transaction_id || "—"],
              ["Notes", selectedPayment.notes || "—"],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border-light)", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
                <span style={{ fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
              </div>
            ))}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.25rem", flexWrap: "wrap" }}>
              {selectedPayment.status === "pending" && (
                <button className="btn btn-primary" onClick={() => { setShowVerifyModal(true); }}>
                  <ShieldCheck size={14} /> Verify & Activate
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowAgreementSlip(true)}>
                <FileText size={14} /> Agreement Slip
              </button>
              <button className="btn btn-secondary" onClick={() => { if (selectedPayment.transaction_id) setShowReceiptLightbox(true); }} disabled={!selectedPayment.transaction_id}>
                <Eye size={14} /> Receipt
              </button>
              <button className="btn btn-ghost" onClick={() => setSelectedPayment(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT LIGHTBOX */}
      {showReceiptLightbox && selectedPayment?.transaction_id && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowReceiptLightbox(false); }}>
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Transaction Receipt</h3>
              <button className="btn-ghost" onClick={() => setShowReceiptLightbox(false)}>✕</button>
            </div>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>{selectedPayment.invoice_number}</div>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>Rs. {Number(selectedPayment.amount).toLocaleString()}</div>
              <div style={{ background: "var(--color-background)", border: "2px dashed var(--color-border)", borderRadius: "8px", padding: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
                <div style={{ fontSize: "2rem" }}>🧾</div>
                <div style={{ fontWeight: 600 }}>Transaction Receipt</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  TXID: {selectedPayment.transaction_id}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {new Date(selectedPayment.date).toLocaleString()}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                  Verify funds in your banking app before marking as verified.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button className="btn btn-primary" onClick={() => setShowReceiptLightbox(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* AGREEMENT SLIP MODAL */}
      {showAgreementSlip && selectedPayment && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAgreementSlip(false); }}>
          <div className="modal-content" style={{ maxWidth: "720px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Payment Agreement Slip</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button className="btn btn-secondary btn-sm" onClick={copyAgreementToClipboard}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy Text"}
                </button>
                <button className="btn-ghost" onClick={() => setShowAgreementSlip(false)}>✕</button>
              </div>
            </div>

            <div style={{ background: "var(--color-surface)", padding: "2rem", borderRadius: "8px", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: "0.875rem", lineHeight: "1.7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>ZEDWIX ENGINE</h1>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Payment Agreement Slip</span>
                </div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                  <div><strong>Invoice:</strong> {selectedPayment.invoice_number}</div>
                  <div><strong>Date:</strong> {new Date(selectedPayment.date).toLocaleDateString("en-GB")}</div>
                  <div><strong>Status:</strong> {selectedPayment.status}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ background: "var(--color-background)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Client Details</div>
                  <div>Name: <strong>{(selectedPayment.client as any)?.name || "—"}</strong></div>
                </div>
                <div style={{ background: "var(--color-background)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Payment Details</div>
                  <div>Amount: <strong style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>Rs. {Number(selectedPayment.amount).toLocaleString()}</strong></div>
                  <div>Method: <strong>{methodLabels[selectedPayment.method] || selectedPayment.method}</strong></div>
                  <div>Transaction: <strong style={{ fontFamily: "var(--font-mono)" }}>{selectedPayment.transaction_id || "—"}</strong></div>
                </div>
              </div>

              <div style={{ background: "var(--color-background)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--color-border)", marginBottom: "1.5rem", fontSize: "0.8125rem" }}>
                <strong>100% Advance Payment Policy:</strong> All consideration represents advance payment for services rendered. Labor performed is strictly non-refundable pursuant to applicable electronic transaction regulations.
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                <div><strong>Invoice:</strong> {selectedPayment.invoice_number}</div>
                <div><strong>Issued:</strong> {new Date(selectedPayment.date).toLocaleDateString("en-GB")}</div>
                {selectedPayment.notes && <div><strong>Notes:</strong> {selectedPayment.notes}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY PAYMENT MODAL */}
      {showVerifyModal && selectedPayment && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowVerifyModal(false); }}>
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Verify & Activate Payment</h3>
              <button className="btn-ghost" onClick={() => setShowVerifyModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.5", marginBottom: "1.25rem" }}>
              Verify funds for <strong>{selectedPayment.invoice_number}</strong> ({selectedPayment.invoice_number}) of <strong>Rs. {Number(selectedPayment.amount).toLocaleString()}</strong> from {(selectedPayment.client as any)?.name || "Client"}. Confirm funds received in your banking app before activating.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyPayment(); }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Transaction Reference / TID</label>
                <input
                  className="form-input"
                  value={verifyReference}
                  onChange={(e) => setVerifyReference(e.target.value)}
                  placeholder="e.g. TRX-123456 or Bank Reference #"
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowVerifyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading || !verifyReference.trim()}>
                  {actionLoading ? "Verifying..." : <><Check size={14} /> Approve & Activate</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Record Payment</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label className="form-label">Client *</label>
                  <select className="form-input form-select" name="client_id" required>
                    <option value="">Select client...</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Project</label>
                  <select className="form-input form-select" name="project_id">
                    <option value="">No project linked</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label className="form-label">Amount (Rs.) *</label><input className="form-input" name="amount" type="number" required placeholder="12000" /></div>
                  <div>
                    <label className="form-label">Method *</label>
                    <select className="form-input form-select" name="method" required>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="jazzcash">JazzCash</option>
                      <option value="easypaisa">Easypaisa</option>
                      <option value="sadapay">SadaPay</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label className="form-label">Date</label><input className="form-input" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} /></div>
                  <div>
                    <label className="form-label">Status</label>
                    <select className="form-input form-select" name="status"><option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option></select>
                  </div>
                </div>
                <div><label className="form-label">Transaction ID</label><input className="form-input" name="transaction_id" placeholder="TRX-XXXXXX" /></div>
                <div><label className="form-label">Notes</label><textarea className="form-input" name="notes" rows={2} placeholder="Optional notes..." /></div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}