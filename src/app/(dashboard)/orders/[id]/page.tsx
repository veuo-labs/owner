"use client";

import { useEffect, useState, use } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Printer,
  ShieldCheck,
  Clock,
  Eye,
  Phone,
  Building,
  AlertCircle,
  FileText,
  Search,
} from "lucide-react";
import type { ZedwixOrder } from "@/lib/types";
import { fetchLiveOrders, executeOrderPaymentVerification, markOrderReadyForHandover } from "@/lib/zedwix-store";

export default function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [order, setOrder] = useState<ZedwixOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceiptLightbox, setShowReceiptLightbox] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverLiveUrl, setHandoverLiveUrl] = useState("");
  const [generatedHandoverLink, setGeneratedHandoverLink] = useState("");
  const [showAgreementSlip, setShowAgreementSlip] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showReceiptInspection, setShowReceiptInspection] = useState(false);
  const [receiptImageUrl, setReceiptImageUrl] = useState("");

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    try {
      setLoading(true);
      const orders = await fetchLiveOrders();
      const found = orders.find((o) => o.id === id);
      setOrder(found || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPayment() {
    if (!order) return;
    const confirmed = confirm(
      `Approve payment and activate plan for ${order.id}?\n\nClient: ${order.client?.name}\nAmount: PKR ${Number(order.purchase?.amountDueToday || 0).toLocaleString()}\n\nPlease verify funds in your banking app before confirming.`
    );
    if (!confirmed) return;

    const tid = order.paymentReceipt?.transactionId || "Digital Receipt Confirmed";
    const success = await executeOrderPaymentVerification(
      order.id,
      Number(order.purchase?.amountDueToday || 0),
      `TID: ${tid}`
    );

    if (success) {
      alert(`Payment verified! Order ${order.id} is now activated.`);
      setShowReceiptLightbox(false);
      loadOrder();
    }
  }

  function handleOpenHandoverModal() {
    if (!order) return;
    const defaultUrl =
      order.liveStoreUrl ||
      (order.purchase?.domainChoice === "custom" && order.purchase?.customDomainName
        ? `https://${order.purchase.customDomainName}`
        : `https://${(order.client?.business || "store").toLowerCase().replace(/[^a-z0-9]/g, "")}.pages.dev`);

    setHandoverLiveUrl(defaultUrl);
    setGeneratedHandoverLink("");
    setShowHandoverModal(true);
  }

  async function handleGenerateHandoverLink() {
    if (!order || !handoverLiveUrl.trim()) {
      alert("Please enter the live store URL.");
      return;
    }

    const token = await markOrderReadyForHandover(order.id, handoverLiveUrl.trim());
    if (token) {
      const fullUrl = `${window.location.origin}/acceptance?token=${token}`;
      setGeneratedHandoverLink(fullUrl);
      loadOrder();
    }
  }

  function copyHandoverToClipboard() {
    if (!generatedHandoverLink) return;
    navigator.clipboard.writeText(generatedHandoverLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  }

  function getStatusBadge(status: string) {
    const cls =
      status === "Payment Verified" || status === "Delivered" || status === "Completed"
        ? "bg-emerald-500/10 text-emerald-500"
        : status === "Payment Review"
        ? "bg-amber-500/10 text-amber-500"
        : status === "In Progress"
        ? "bg-blue-500/10 text-blue-500"
        : "bg-zinc-500/10 text-zinc-400";
    return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{status}</span>;
  }

  if (loading) {
    return <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold mb-2">Order Not Found</h2>
        <p className="text-sm text-muted-foreground">No order with ID &ldquo;{id}&rdquo; was found.</p>
      </div>
    );
  }

  const p = order.purchase;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order {order.id}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agreement: <span className="font-mono">{order.agreementId}</span>
            {" "}&middot; Created{" "}
            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">{getStatusBadge(order.status)}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Client</p>
          <p className="text-sm font-semibold">{order.client?.name || "—"}</p>
          <p className="text-xs text-muted-foreground">{order.client?.business || ""}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Amount Due</p>
          <p className="text-sm font-semibold">PKR {Number(p?.amountDueToday || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{p?.plan || "—"} plan</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Payment</p>
          <p className="text-sm font-semibold">{order.status}</p>
          <p className="text-xs text-muted-foreground">{p?.paymentMethod || "—"}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Handover</p>
          <p className="text-sm font-semibold">{order.handoverStatus || "Pending Setup"}</p>
          <p className="text-xs text-muted-foreground">{order.handoverToken ? "Token issued" : "No token"}</p>
        </div>
      </div>

      {/* Client Info */}
      <div className="rounded-lg border border-border p-5 bg-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">Client Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Full Name:</span> <strong>{order.client?.name}</strong></div>
          <div><span className="text-muted-foreground">Business:</span> <strong>{order.client?.business}</strong></div>
          <div>
            <span className="text-muted-foreground">WhatsApp:</span>{" "}
            {order.client?.whatsapp ? (
              <a href={`https://wa.me/${order.client.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="text-emerald-500 underline font-mono">{order.client.whatsapp}</a>
            ) : "—"}
          </div>
          <div><span className="text-muted-foreground">Email:</span> <span className="font-mono">{order.client?.email || "—"}</span></div>
          <div className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> {order.client?.address || "—"}</div>
        </div>
      </div>

      {/* Purchase & Payment Scope */}
      <div className="rounded-lg border border-border p-5 bg-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">Purchase & Payment Scope</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Selected Plan:</span> <strong>{p?.plan}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery Turnaround:</span> <span>{p?.deliveryTurnaround || "Standard"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery Surcharge:</span> <span className="font-mono">{p?.deliveryFee ? `+PKR ${p.deliveryFee.toLocaleString()}` : "Included"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Product Quota:</span> <span className="font-mono">{p?.totalProductQuota || p?.productLimit || "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Payment Method:</span> <span className="uppercase">{p?.paymentMethod}</span></div>
          <div className="flex justify-between border-t border-border pt-2 mt-1"><strong>Amount Due:</strong> <strong className="font-mono text-base">PKR {Number(p?.amountDueToday || 0).toLocaleString()}</strong></div>
        </div>
        {p?.managedStoreTier && (
          <div className="mt-3 text-xs">
            Add-on Tier: <span className="font-mono font-semibold">{p.managedStoreTier === "full" ? "Full Store Management" : "Basic Platform Care"}</span>
          </div>
        )}
      </div>

      {/* Receipt */}
      {order.paymentReceipt?.dataUrl && (
        <div className="rounded-lg border border-border p-5 bg-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Customer Receipt</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowReceiptInspection(true)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                <Eye size={12} /> Inspect Full Size
              </button>
              <button onClick={() => setShowReceiptLightbox(true)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                <Printer size={12} /> Print / PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <img src={order.paymentReceipt.dataUrl} alt="Receipt" className="max-h-64 rounded-md border border-border object-contain" />
          </div>
          {order.paymentReceipt.transactionId && (
            <p className="text-xs font-mono text-muted-foreground mt-2">Transaction ID: {order.paymentReceipt.transactionId}</p>
          )}
        </div>
      )}

      {/* Evidence & Audit Trail */}
      {(order.evidence || order.auditTrail?.length) && (
        <div className="rounded-lg border border-border p-5 bg-card">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">Electronic Acceptance Evidence</h2>
          {order.evidence && (
            <div className="text-sm space-y-1 mb-4">
              <div><span className="text-muted-foreground">Agreement ID:</span> <span className="font-mono">{order.agreementId}</span></div>
              <div><span className="text-muted-foreground">Acceptance Time:</span> {new Date(order.evidence.acceptanceTimestamp || order.createdAt).toLocaleString()}</div>
              <div><span className="text-muted-foreground">Platform:</span> {order.evidence.platform || "Web"}</div>
              <div><span className="text-muted-foreground">Consent State:</span> <span className="text-emerald-500 font-semibold">[AFFIRMATIVE CONSENT LOGGED]</span></div>
              {order.evidence.contentHash && (
                <div className="break-all font-mono text-xs text-muted-foreground bg-muted/40 p-2 rounded">{order.evidence.contentHash}</div>
              )}
            </div>
          )}
          {order.auditTrail && order.auditTrail.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Audit Trail</p>
              {order.auditTrail.map((entry, i) => (
                <div key={i} className="text-xs flex gap-2 p-2 rounded bg-muted/20">
                  <span className="font-mono text-muted-foreground shrink-0">{new Date(entry.timestamp).toLocaleString()}</span>
                  <span><strong>{entry.actor}:</strong> {entry.event}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Handover */}
      <div className="rounded-lg border border-border p-5 bg-card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">Digital Delivery Handover</h2>
        <div className="text-sm">
          <p className="mb-2"><span className="font-semibold">Status:</span> {order.handoverStatus || "Pending Setup"}</p>
          {order.handoverStatus === "Accepted & Delivered" && order.handoverEvidence && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-emerald-600 font-bold mb-1">✓ FORMALLY SIGNED & DELIVERED</p>
              <p className="text-xs"><strong>Signatory:</strong> {order.handoverEvidence.clientSignerName}</p>
              <p className="text-xs"><strong>Accepted:</strong> {new Date(order.handoverEvidence.acceptedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
        {order.status !== "Payment Verified" && (
          <button onClick={handleOpenHandoverModal} className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
            <ShieldCheck size={16} /> Issue Handover Sign-off Link
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {order.status !== "Payment Verified" && (
          <button onClick={handleVerifyPayment} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Check size={16} /> Approve & Activate Plan
          </button>
        )}
        <button onClick={() => setShowAgreementSlip(true)} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
          <Printer size={16} /> Generate Agreement Slip
        </button>
      </div>

      {/* Receipt Lightbox */}
      {showReceiptLightbox && order.paymentReceipt?.dataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowReceiptLightbox(false)}>
          <div className="w-full max-w-3xl rounded-xl bg-card p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold">Payment Receipt</h3>
              <button onClick={() => setShowReceiptLightbox(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <img src={order.paymentReceipt.dataUrl} alt="Receipt" className="w-full max-h-[70vh] object-contain rounded-md" />
            <p className="text-xs font-mono text-muted-foreground mt-2">Order: {order.id} &middot; Client: {order.client?.name}</p>
          </div>
        </div>
      )}

      {/* Receipt Inspection Modal */}
      {showReceiptInspection && order.paymentReceipt?.dataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowReceiptInspection(false)}>
          <div className="w-full max-w-3xl rounded-xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Receipt Inspection</h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">Order: {order.id}</p>
              </div>
              <button onClick={() => setShowReceiptInspection(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <img src={order.paymentReceipt.dataUrl} alt="Receipt" className="w-full rounded-md border border-border object-contain" />
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-md bg-muted/30">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Transaction ID</p>
                  <p className="font-mono">{order.paymentReceipt.transactionId || "N/A"}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/30">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">File Name</p>
                  <p>{order.paymentReceipt.fileName || "N/A"}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/30">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">File Size</p>
                  <p>{order.paymentReceipt.fileSize ? `${(order.paymentReceipt.fileSize / 1024).toFixed(1)} KB` : "N/A"}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/30">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Uploaded At</p>
                  <p>{order.paymentReceipt.uploadedAt ? new Date(order.paymentReceipt.uploadedAt).toLocaleString() : "N/A"}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/30">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Status</p>
                  <p className={order.paymentVerification?.verified ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                    {order.paymentVerification?.verified ? "✓ Verified" : "Pending Verification"}
                  </p>
                </div>
                {order.paymentVerification && (
                  <div className="p-3 rounded-md bg-muted/30">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Verification</p>
                    <p className="text-xs">By: {order.paymentVerification.verifiedBy || "—"}</p>
                    <p className="text-xs">Amount: {order.paymentVerification.amountVerified ? `PKR ${order.paymentVerification.amountVerified.toLocaleString()}` : "—"}</p>
                    <p className="text-xs">Ref: {order.paymentVerification.paymentReference || "—"}</p>
                    <p className="text-xs">Verified: {order.paymentVerification.verifiedAt ? new Date(order.paymentVerification.verifiedAt).toLocaleString() : "—"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {showHandoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowHandoverModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold">Issue Digital Delivery Handover Link</h3>
              <button onClick={() => setShowHandoverModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the live storefront address. This generates a secure digital sign-off link for client review.
            </p>
            <div className="mb-4">
              <label className="text-xs font-semibold block mb-1">Live Storefront URL</label>
              <input type="url" value={handoverLiveUrl} onChange={(e) => setHandoverLiveUrl(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowHandoverModal(false)} className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground text-sm">Cancel</button>
              <button onClick={handleGenerateHandoverLink} className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Generate Sign-off Link</button>
            </div>
            {generatedHandoverLink && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-mono font-bold text-emerald-500 mb-1">Handover Link Ready:</p>
                <div className="flex gap-2">
                  <input readOnly value={generatedHandoverLink} className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono" />
                  <button onClick={copyHandoverToClipboard} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                    {copiedLink ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agreement Slip Modal */}
      {showAgreementSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowAgreementSlip(false)}>
          <div className="w-full max-w-4xl rounded-xl bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-lg font-bold">Master Service Agreement / Order Record</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                  <Printer size={12} /> Print / PDF
                </button>
                <button onClick={() => setShowAgreementSlip(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
            </div>
            <div className="text-sm leading-relaxed">
              <div className="flex justify-between border-b-2 border-border pb-3 mb-3">
                <div><h1 className="text-xl font-extrabold">ZEDWIX ENGINE</h1><span className="text-xs text-muted-foreground">Master Service Agreement / Order Record</span></div>
                <div className="text-right font-mono text-xs">
                  <div><strong>Order:</strong> {order.id}</div>
                  <div><strong>Agreement ID:</strong> {order.agreementId}</div>
                  <div><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString("en-GB")}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-muted/30 p-3 rounded-md border border-border">
                  <div className="font-bold mb-2 text-xs uppercase text-muted-foreground">Client Details</div>
                  <div>Name: <strong>{order.client?.name}</strong></div>
                  <div>Business: <strong>{order.client?.business}</strong></div>
                  <div>WhatsApp: {order.client?.whatsapp}</div>
                  <div>Email: {order.client?.email || "—"}</div>
                </div>
                <div className="bg-muted/30 p-3 rounded-md border border-border">
                  <div className="font-bold mb-2 text-xs uppercase text-muted-foreground">Plan & Pricing</div>
                  <div>Plan: <strong>{p?.plan} Engine</strong></div>
                  <div>Turnaround: <strong>{p?.deliveryTurnaround || "Standard"}</strong></div>
                  <div>Paid: <strong className="text-accent font-mono">PKR {Number(p?.amountDueToday || 0).toLocaleString()}</strong></div>
                  <div>Status: {order.status}</div>
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded-md border border-border mb-3 text-xs">
                <strong>100% Advance Payment Policy:</strong> All consideration represents advance payment for custom digital engineering labor and software deployment.
              </div>
              <div className="font-mono text-xs text-muted-foreground border-t border-border pt-2">
                <div><strong>Document Hash:</strong> {order.evidence?.contentHash || "Recorded"}</div>
                <div><strong>Handover:</strong> {order.handoverStatus || "Pending Setup"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
