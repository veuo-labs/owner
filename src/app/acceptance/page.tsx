"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ShieldCheck,
  AlertCircle,
  Clock,
  ExternalLink,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Signature,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchLiveOrders } from "@/lib/zedwix-store";
import type { ZedwixOrder } from "@/lib/types";

export default function AcceptancePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [order, setOrder] = useState<ZedwixOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerDesignation, setSignerDesignation] = useState("");
  const [acceptanceNotes, setAcceptanceNotes] = useState("");
  const [signatureCanvas, setSignatureCanvas] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setError("No sign-off token provided. Please use the link sent to you by the store owner.");
      setLoading(false);
      return;
    }
    loadOrderByToken(token);
  }, [token]);

  async function loadOrderByToken(token: string) {
    try {
      setLoading(true);
      const orders = await fetchLiveOrders();
      const found = orders.find(
        (o) => o.handoverToken === token || o.handoverToken?.toLowerCase() === token.toLowerCase()
      );
      if (found) {
        setOrder(found);
        if (found.handoverStatus === "Accepted & Delivered") {
          setSigned(true);
        }
      } else {
        setError("Invalid or expired sign-off link. Please contact the store owner.");
      }
    } catch (e) {
      setError("Failed to load order. Please try again or contact the store owner.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOff() {
    if (!order || !signerName.trim()) return;
    setSigning(true);
    try {
      const nowIso = new Date().toISOString();
      const supabase = createClient();
      const { error } = await supabase
        .from("owner_orders")
        .update({
          handover_status: "Accepted & Delivered",
          handover_evidence: {
            clientSignerName: signerName.trim(),
            clientDesignation: signerDesignation.trim() || undefined,
            clientIp: window.location.hostname,
            platform: "Web",
            acceptedAt: nowIso,
            signatureDataUrl: signatureCanvas || undefined,
            handoverHash: "handover-" + order.id + "-" + Date.now(),
          },
          evidence: {
            contentHash: "acceptance-" + order.id + "-" + Date.now(),
            acceptanceTimestamp: nowIso,
            platform: "Web",
            userAgent: navigator.userAgent,
          },
          audit_trail: [
            ...(order.auditTrail || []),
            {
              event: `Client sign-off recorded by ${signerName.trim()}`,
              timestamp: nowIso,
              actor: "Client",
            },
          ],
        })
        .eq("id", order.id);

      if (error) throw error;

      setSigned(true);
    } catch (e) {
      console.error(e);
      alert("Failed to record sign-off. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
          <h1 className="text-xl font-semibold">Loading sign-off...</h1>
          <p className="text-sm text-muted-foreground mt-2">Verifying your sign-off link</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-xl font-semibold">Sign-off Link Invalid</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">{error}</p>
          <p className="text-xs text-muted-foreground">
            Contact the store owner if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  if (signed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <Check className="mx-auto h-16 w-16 text-emerald-500 mb-6" />
          <h1 className="text-2xl font-bold">Sign-off Recorded</h1>
          <p className="text-muted-foreground mt-3">
            Your formal acceptance for order <strong className="font-mono">{order.id}</strong> has been recorded.
          </p>
          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-left text-sm">
            <p><strong>Order:</strong> {order.id}</p>
            <p><strong>Client:</strong> {order.client?.name}</p>
            <p><strong>Signed by:</strong> {order.handoverEvidence?.clientSignerName || "—"}</p>
            <p><strong>Date:</strong> {new Date(order.handoverEvidence?.acceptedAt || order.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-2xl font-bold">Digital Delivery Sign-off</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Please review and formally accept delivery of the following order
          </p>
        </div>

        {/* Order Details */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold">Order {order.id}</h2>
              <p className="text-xs font-mono text-muted-foreground">Agreement: {order.agreementId}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              {order.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Client</p>
              <p className="font-semibold">{order.client?.name}</p>
              <p className="text-muted-foreground">{order.client?.business}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Amount</p>
              <p className="font-semibold">PKR {Number(order.purchase?.amountDueToday || 0).toLocaleString()}</p>
              <p className="text-muted-foreground">{order.purchase?.plan}</p>
            </div>
            {order.liveStoreUrl && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Live Storefront</p>
                <a
                  href={order.liveStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline font-mono text-sm inline-flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  {order.liveStoreUrl}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Sign-off Form */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Signature size={18} /> Client Sign-off
          </h2>

          <div>
            <label className="block text-xs font-medium mb-1">Full Name *</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Designation / Role</label>
            <input
              type="text"
              value={signerDesignation}
              onChange={(e) => setSignerDesignation(e.target.value)}
              placeholder="e.g. CEO, Operations Manager"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Acceptance Notes (optional)</label>
            <textarea
              value={acceptanceNotes}
              onChange={(e) => setAcceptanceNotes(e.target.value)}
              placeholder="Any notes about this acceptance..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Signature</label>
            <div className="border border-border rounded-md bg-background p-2">
              <canvas
                id="signature-canvas"
                width={600}
                height={200}
                className="w-full cursor-crosshair border border-border rounded"
                onMouseDown={(e) => {
                  const canvas = e.currentTarget;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) return;
                  ctx.strokeStyle = "#000";
                  ctx.lineWidth = 2;
                  ctx.lineCap = "round";
                  const rect = canvas.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  ctx.beginPath();
                  ctx.moveTo(x, y);
                  const handleMove = (ev: MouseEvent) => {
                    ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top);
                    ctx.stroke();
                  };
                  const handleUp = () => {
                    canvas.removeEventListener("mousemove", handleMove);
                    canvas.removeEventListener("mouseup", handleUp);
                  };
                  canvas.addEventListener("mousemove", handleMove);
                  canvas.addEventListener("mouseup", handleUp);
                }}
              />
              <button
                onClick={() => {
                  const canvas = document.getElementById("signature-canvas") as HTMLCanvasElement;
                  if (canvas) {
                    const ctx = canvas.getContext("2d");
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                    setSignatureCanvas("");
                  }
                }}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground border border-border">
            <p className="flex items-start gap-2">
              <FileText size={14} className="shrink-0 mt-0.5" />
              <span>
                By signing, you confirm that you have received the deliverables listed in the Master Service Agreement
                for Order {order.id} and accept them as complete per the agreed terms.
              </span>
            </p>
          </div>

          <button
            onClick={handleSignOff}
            disabled={signing || !signerName.trim()}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {signing ? (
              <>
                <Clock size={16} className="animate-spin" /> Recording...
              </>
            ) : (
              <>
                <Check size={16} /> Confirm &amp; Sign Off
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Order: {order.id} · Agreement: {order.agreementId}</p>
          <p className="mt-1">This sign-off will be recorded with timestamp, IP address, and client details.</p>
        </div>
      </div>
    </div>
  );
}
