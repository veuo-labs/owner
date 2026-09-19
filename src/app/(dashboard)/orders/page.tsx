"use client";

import { useEffect, useState } from "react";
import {
  fetchLiveOrders,
  executeOrderPaymentVerification,
  markOrderReadyForHandover,
  subscribeToZedwixStore,
} from "@/lib/zedwix-store";
import type { ZedwixOrder } from "@/lib/types";
import {
  Search,
  Check,
  Copy,
  ExternalLink,
  Printer,
  ShieldCheck,
  Clock,
  Eye,
  FileText,
  AlertCircle,
  Phone,
  Building,
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<ZedwixOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeOrder, setActiveOrder] = useState<ZedwixOrder | null>(null);

  // Modals
  const [showReceiptLightbox, setShowReceiptLightbox] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverLiveUrl, setHandoverLiveUrl] = useState("");
  const [generatedHandoverLink, setGeneratedHandoverLink] = useState("");
  const [showAgreementSlip, setShowAgreementSlip] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadOrders();
    const unsub = subscribeToZedwixStore(() => {
      loadOrders();
    });
    return () => unsub();
  }, []);

  async function loadOrders() {
    try {
      const list = await fetchLiveOrders();
      setOrders(list);
      if (activeOrder) {
        const fresh = list.find((o) => o.id === activeOrder.id);
        if (fresh) setActiveOrder(fresh);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchClient = (o.client?.name || "").toLowerCase().includes(q);
      const matchBiz = (o.client?.business || "").toLowerCase().includes(q);
      return matchId || matchClient || matchBiz;
    }
    return true;
  });

  async function handleVerifyPayment() {
    if (!activeOrder) return;
    const confirmed = confirm(
      `Approve payment and activate plan for ${activeOrder.id}?\n\nClient: ${activeOrder.client?.name} (${activeOrder.client?.business})\nAmount: PKR ${Number(activeOrder.purchase?.amountDueToday || 0).toLocaleString()}\n\nPlease verify funds in your banking app before confirming.`
    );
    if (!confirmed) return;

    const tid = activeOrder.paymentReceipt?.transactionId || "Digital Receipt Confirmed";
    const success = await executeOrderPaymentVerification(
      activeOrder.id,
      Number(activeOrder.purchase?.amountDueToday || 0),
      `TID: ${tid}`
    );

    if (success) {
      alert(`Payment verified! Order ${activeOrder.id} is now activated.`);
      setShowReceiptLightbox(false);
      loadOrders();
    }
  }

  function handleOpenHandoverModal() {
    if (!activeOrder) return;
    const defaultUrl =
      activeOrder.liveStoreUrl ||
      (activeOrder.purchase?.domainChoice === "custom" && activeOrder.purchase?.customDomainName
        ? `https://${activeOrder.purchase.customDomainName}`
        : `https://${(activeOrder.client?.business || "store").toLowerCase().replace(/[^a-z0-9]/g, "")}.pages.dev`);

    setHandoverLiveUrl(defaultUrl);
    setGeneratedHandoverLink("");
    setShowHandoverModal(true);
  }

  async function handleGenerateHandoverLink() {
    if (!activeOrder || !handoverLiveUrl.trim()) {
      alert("Please enter the live store URL.");
      return;
    }

    const token = await markOrderReadyForHandover(activeOrder.id, handoverLiveUrl.trim());
    if (token) {
      const fullUrl = `${window.location.origin}/acceptance.html?token=${token}`;
      setGeneratedHandoverLink(fullUrl);
      loadOrders();
    }
  }

  function copyHandoverToClipboard() {
    if (!generatedHandoverLink) return;
    navigator.clipboard.writeText(generatedHandoverLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>INCOMING ORDERS</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Real-time checkout synchronizer • <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{orders.length}</span> orders recorded
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div className="topbar-search" style={{ width: "100%", maxWidth: "340px" }}>
          <Search size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search Order ID, Client, Store..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {["ALL", "Payment Review", "Payment Verified", "In Progress", "Delivered", "Completed"].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem" }}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="data-table-wrapper" style={{ marginBottom: "2rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Client</th>
              <th>Business / Store</th>
              <th>Plan & Speed</th>
              <th>Amount Due</th>
              <th>Payment Info</th>
              <th>Add-on Tier</th>
              <th>Handover Status</th>
              <th>Created</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                  Connecting to live orders stream...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: "3.5rem", color: "var(--color-text-muted)" }}>
                  No orders found. New client orders placed on the storefront or pricing checkout will appear here automatically in real time.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const isUrgent =
                  o.purchase?.deliveryOptionId === "urgent_1d" ||
                  o.purchase?.deliveryOptionId === "urgent_2d" ||
                  o.purchase?.deliveryOptionId === "urgent_3d" ||
                  o.purchase?.deliveryFee > 0;

                const hasReceipt = Boolean(o.paymentReceipt?.dataUrl);

                return (
                  <tr key={o.id} style={{ background: activeOrder?.id === o.id ? "rgba(255, 255, 255, 0.04)" : "transparent" }}>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-text)" }}>
                      {o.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{o.client?.name || "Client"}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{o.client?.business || "Store"}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.purchase?.plan || "Starter"}</div>
                      {isUrgent ? (
                        <span style={{ display: "inline-block", background: "var(--color-accent)", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.35rem", borderRadius: "2px", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
                          ⚡ FAST-TRACK
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                          STD ({o.purchase?.deliveryTurnaround || "5-9d"})
                        </span>
                      )}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      PKR {Number(o.purchase?.amountDueToday || 0).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                        {o.purchase?.paymentMethod || "BANK"}
                      </div>
                      {hasReceipt && (
                        <span style={{ display: "inline-block", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-accent)", fontSize: "0.65rem", fontWeight: 700, padding: "0.05rem 0.3rem", borderRadius: "2px", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
                          [RECEIPT]
                        </span>
                      )}
                      {o.paymentReceipt?.transactionId && (
                        <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                          TID: {o.paymentReceipt.transactionId}
                        </div>
                      )}
                    </td>
                    <td>
                      {o.purchase?.managedStoreTier === "full" ? (
                        <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "2px", background: "rgba(34, 197, 94, 0.12)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.3)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                          FULL (5K/MO)
                        </span>
                      ) : o.purchase?.managedStoreTier === "basic" || o.purchase?.managedStore ? (
                        <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "2px", background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)", fontFamily: "var(--font-mono)" }}>
                          BASIC (2K/MO)
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>None</span>
                      )}
                    </td>
                    <td>
                      {o.handoverStatus === "Accepted & Delivered" ? (
                        <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.45rem", borderRadius: "2px", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          DELIVERED & SIGNED
                        </span>
                      ) : o.handoverStatus === "Store Delivered - Pending Client Sign-off" ? (
                        <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.45rem", borderRadius: "2px", border: "1px dashed var(--color-border)", color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>
                          AWAITING SIGN-OFF
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                          [PENDING SETUP]
                        </span>
                      )}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                    <td>
                      <span className={`status-badge ${o.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        <span className="status-badge-dot" />
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem" }}
                        onClick={() => {
                          setActiveOrder(o);
                          const el = document.getElementById("orderDetailSection");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ORDER DETAIL SECTION */}
      {activeOrder && (
        <div id="orderDetailSection" className="metric-card" style={{ padding: "2rem", marginBottom: "3rem", border: "1px solid var(--color-border)" }}>
          {/* Detail Header & Action Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--color-border)", paddingBottom: "1.25rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Order Record Details
              </span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.2rem 0 0", color: "var(--color-text)" }}>
                {activeOrder.id}
              </h2>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {activeOrder.status !== "Payment Verified" && (
                <button className="btn btn-primary" onClick={handleVerifyPayment}>
                  <Check size={16} />
                  ✓ Approve & Activate Plan
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleOpenHandoverModal}>
                <ShieldCheck size={16} />
                Handover Sign-off Link
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAgreementSlip(true)}>
                <Printer size={16} />
                Generate Agreement Slip
              </button>
              <button className="btn btn-ghost" onClick={() => setActiveOrder(null)}>
                Close
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {/* Column 1: Client & Scope */}
            <div>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                Client Information
              </h4>
              <div style={{ background: "var(--color-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.875rem", lineHeight: "1.8" }}>
                <div><span style={{ color: "var(--color-text-muted)" }}>Full Name:</span> <strong>{activeOrder.client?.name}</strong></div>
                <div><span style={{ color: "var(--color-text-muted)" }}>Business / Store:</span> <strong>{activeOrder.client?.business}</strong></div>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>WhatsApp:</span>{" "}
                  <a
                    href={`https://wa.me/${(activeOrder.client?.whatsapp || "").replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#22c55e", textDecoration: "underline", fontFamily: "var(--font-mono)" }}
                  >
                    {activeOrder.client?.whatsapp}
                  </a>
                </div>
                <div><span style={{ color: "var(--color-text-muted)" }}>Email:</span> <span style={{ fontFamily: "var(--font-mono)" }}>{activeOrder.client?.email || "—"}</span></div>
                <div><span style={{ color: "var(--color-text-muted)" }}>Address:</span> {activeOrder.client?.address || "—"}</div>
              </div>

              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", margin: "1.5rem 0 0.75rem" }}>
                Purchase & Payment Scope
              </h4>
              <div style={{ background: "var(--color-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.875rem", lineHeight: "1.8" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Selected Plan:</span>
                  <strong>{activeOrder.purchase?.plan}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Delivery Turnaround:</span>
                  <span>{activeOrder.purchase?.deliveryTurnaround || "Standard (5–9 Days)"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Delivery Surcharge:</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {activeOrder.purchase?.deliveryFee ? `+PKR ${activeOrder.purchase.deliveryFee.toLocaleString()}` : "Included"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Product Quota:</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {activeOrder.purchase?.totalProductQuota || activeOrder.purchase?.productLimit || 100} products
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Payment Method:</span>
                  <span style={{ textTransform: "uppercase" }}>{activeOrder.purchase?.paymentMethod}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                  <strong style={{ color: "var(--color-text)" }}>Amount Due:</strong>
                  <strong style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", color: "var(--color-accent)" }}>
                    PKR {Number(activeOrder.purchase?.amountDueToday || 0).toLocaleString()}
                  </strong>
                </div>

                {/* Receipt Box */}
                {activeOrder.paymentReceipt?.dataUrl ? (
                  <div style={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.75rem", marginTop: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.725rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>CUSTOMER RECEIPT:</span>
                      <button className="btn-ghost" style={{ fontSize: "0.725rem", color: "var(--color-accent)" }} onClick={() => setShowReceiptLightbox(true)}>
                        🔍 Inspect Full Size
                      </button>
                    </div>
                    <div style={{ cursor: "pointer" }} onClick={() => setShowReceiptLightbox(true)}>
                      <img src={activeOrder.paymentReceipt.dataUrl} style={{ maxHeight: "100px", maxWidth: "100%", borderRadius: "4px", objectFit: "contain" }} alt="Receipt" />
                    </div>
                  </div>
                ) : (
                  <div style={{ border: "1px dashed var(--color-border)", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.75rem", textAlign: "center" }}>
                    [No screenshot uploaded — Verify funds directly in bank app]
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Legal Evidence & Audit Trail */}
            <div>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                Electronic Acceptance Evidence
              </h4>
              <div style={{ background: "var(--color-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.8125rem", lineHeight: "1.7" }}>
                <div><span style={{ color: "var(--color-text-muted)" }}>Agreement ID:</span> <span style={{ fontFamily: "var(--font-mono)" }}>{activeOrder.agreementId}</span></div>
                <div><span style={{ color: "var(--color-text-muted)" }}>Acceptance Time:</span> {new Date(activeOrder.evidence?.acceptanceTimestamp || activeOrder.createdAt).toLocaleString()}</div>
                <div><span style={{ color: "var(--color-text-muted)" }}>Platform:</span> {activeOrder.evidence?.platform || "Web"}</div>
                <div><span style={{ color: "var(--color-text-muted)" }}>Consent State:</span> <strong style={{ color: "#22c55e" }}>[AFFIRMATIVE CONSENT LOGGED]</strong></div>
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", textTransform: "uppercase" }}>Immutable Hash (SHA-256):</div>
                  <div style={{ wordBreak: "break-all", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", background: "var(--color-background)", padding: "0.35rem 0.5rem", borderRadius: "4px", border: "1px solid var(--color-border)", marginTop: "0.2rem" }}>
                    {activeOrder.evidence?.contentHash || "Computed at checkout"}
                  </div>
                </div>
              </div>

              {/* Handover Status */}
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", margin: "1.5rem 0 0.75rem" }}>
                Digital Delivery Handover Certificate
              </h4>
              {activeOrder.handoverStatus === "Accepted & Delivered" && activeOrder.handoverEvidence ? (
                <div style={{ background: "var(--color-surface)", border: "1px solid rgba(34, 197, 94, 0.4)", borderRadius: "8px", padding: "1.25rem", fontSize: "0.8125rem" }}>
                  <div style={{ color: "#22c55e", fontWeight: 700, marginBottom: "0.5rem" }}>
                    ✓ FORMALLY SIGNED & DELIVERED
                  </div>
                  <div><strong>Signatory:</strong> {activeOrder.handoverEvidence.clientSignerName}</div>
                  <div><strong>Accepted:</strong> {new Date(activeOrder.handoverEvidence.acceptedAt).toLocaleString()}</div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "0.7rem" }}>Recorded E-Signature:</div>
                    <img src={activeOrder.handoverEvidence.signatureDataUrl} style={{ maxHeight: "50px", background: "#fff", padding: "4px", borderRadius: "4px", marginTop: "4px" }} alt="Signature" />
                  </div>
                </div>
              ) : (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                  <div>Status: <strong>{activeOrder.handoverStatus || "Pending Setup"}</strong></div>
                  <p style={{ margin: "0.4rem 0 0.75rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    Once store is deployed, issue the digital sign-off link to client for formal electronic signature.
                  </p>
                  <button className="btn btn-secondary btn-sm" onClick={handleOpenHandoverModal}>
                    Generate Delivery Sign-off Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT INSPECTION LIGHTBOX MODAL */}
      {showReceiptLightbox && activeOrder?.paymentReceipt?.dataUrl && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowReceiptLightbox(false); }}>
          <div className="modal-content" style={{ maxWidth: "800px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Payment Receipt Screenshot</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                  Order: {activeOrder.id} • Client: {activeOrder.client?.name} • Due: PKR {activeOrder.purchase?.amountDueToday?.toLocaleString()}
                </span>
              </div>
              <button className="btn-ghost" onClick={() => setShowReceiptLightbox(false)}>✕</button>
            </div>
            <div style={{ background: "#000", padding: "1rem", borderRadius: "8px", textAlign: "center", overflow: "auto", maxHeight: "65vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={activeOrder.paymentReceipt.dataUrl} style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }} alt="Full receipt" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Confirm credit in mobile bank app before approval.
              </span>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn btn-secondary" onClick={() => setShowReceiptLightbox(false)}>Close</button>
                {activeOrder.status !== "Payment Verified" && (
                  <button className="btn btn-primary" onClick={handleVerifyPayment}>
                    ✓ Approve Payment & Activate Plan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HANDOVER LINK MODAL */}
      {showHandoverModal && activeOrder && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowHandoverModal(false); }}>
          <div className="modal-content" style={{ maxWidth: "540px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Issue Digital Delivery Handover Link</h3>
              <button className="btn-ghost" onClick={() => setShowHandoverModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.5", marginBottom: "1.25rem" }}>
              Enter the live storefront address. This generates a secure digital sign-off link for client review, legal agreement, and e-signature.
            </p>
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Live Storefront URL</label>
              <input
                className="form-input"
                type="url"
                value={handoverLiveUrl}
                onChange={(e) => setHandoverLiveUrl(e.target.value)}
                placeholder="https://brand.pages.dev"
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowHandoverModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGenerateHandoverLink}>
                Generate Sign-off Link
              </button>
            </div>

            {generatedHandoverLink && (
              <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border)" }}>
                <label className="form-label" style={{ color: "#22c55e" }}>Handover Sign-off Link Ready:</label>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem" }}>
                  <input
                    className="form-input"
                    readOnly
                    value={generatedHandoverLink}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={copyHandoverToClipboard}>
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    {copiedLink ? "Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                  Share this link with your client on WhatsApp. When signed, the order updates to Delivered.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE AGREEMENT SLIP MODAL */}
      {showAgreementSlip && activeOrder && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAgreementSlip(false); }}>
          <div className="modal-content" style={{ maxWidth: "860px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Master Service Agreement / Order Record</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button className="btn-ghost" onClick={() => setShowAgreementSlip(false)}>✕</button>
              </div>
            </div>

            <div style={{ background: "var(--color-surface)", padding: "2rem", borderRadius: "8px", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: "0.875rem", lineHeight: "1.7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>ZEDWIX ENGINE</h1>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Master Service Agreement / Order Record</span>
                </div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                  <div><strong>Order:</strong> {activeOrder.id}</div>
                  <div><strong>Agreement ID:</strong> {activeOrder.agreementId}</div>
                  <div><strong>Date:</strong> {new Date(activeOrder.createdAt).toLocaleDateString("en-GB")}</div>
                </div>
              </div>

              {/* Client and Scope Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ background: "var(--color-background)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Client Details</div>
                  <div>Name: <strong>{activeOrder.client?.name}</strong></div>
                  <div>Business: <strong>{activeOrder.client?.business}</strong></div>
                  <div>WhatsApp: {activeOrder.client?.whatsapp}</div>
                  <div>Email: {activeOrder.client?.email || "—"}</div>
                </div>
                <div style={{ background: "var(--color-background)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Plan & Pricing</div>
                  <div>Plan: <strong>{activeOrder.purchase?.plan} Engine</strong></div>
                  <div>Delivery Turnaround: <strong>{activeOrder.purchase?.deliveryTurnaround || "Standard"}</strong></div>
                  <div>Total Advance Paid: <strong style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>PKR {Number(activeOrder.purchase?.amountDueToday || 0).toLocaleString()}</strong></div>
                  <div>Status: <span className={`status-badge ${activeOrder.status.toLowerCase().replace(/\s+/g, "-")}`}>{activeOrder.status}</span></div>
                </div>
              </div>

              {/* Non-Refundable & Policy */}
              <div style={{ background: "var(--color-background)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--color-border)", marginBottom: "1.5rem", fontSize: "0.8125rem" }}>
                <strong>100% Advance Payment Policy:</strong> All consideration represents advance payment for custom digital engineering labor and software deployment. Labor performed is strictly non-refundable pursuant to the Electronic Transactions Ordinance, 2002.
              </div>

              {/* Cryptographic hash */}
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
                <div><strong>Document Integrity Hash:</strong> {activeOrder.evidence?.contentHash || "Recorded"}</div>
                <div><strong>Handover Status:</strong> {activeOrder.handoverStatus || "Pending Setup"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
