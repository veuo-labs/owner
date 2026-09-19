"use client";

import { useEffect, useState } from "react";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

interface AbandonedLead {
  id: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  subtotal: number;
  cart_items?: Array<{ productName: string; quantity: number }>;
  recovered: boolean;
}

export default function AbandonedOrdersPage() {
  const [leads, setLeads] = useState<AbandonedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    try {
      setError(null);
      const res = await fetch("/api/orders/abandoned");
      const json = await res.json();
      if (json.success && json.leads) {
        setLeads(json.leads);
      } else {
        setLeads([]);
      }
    } catch (e) {
      setError("Failed to load abandoned checkouts");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function cleanPhone(phone: string) {
    let p = phone.replace(/[^0-9]/g, "");
    if (p.startsWith("0")) p = "92" + p.slice(1);
    return p;
  }

  function getRecoveryWhatsAppUrl(lead: AbandonedLead) {
    const phone = cleanPhone(lead.customer_phone);
    const items = Array.isArray(lead.cart_items) ? lead.cart_items : [];
    const itemNames = items.map((it) => it.productName || "piece").join(", ");
    const msg = [
      `Hi ${lead.customer_name || "there"}!`,
      ``,
      `We noticed you were checking out ${itemNames ? `"${itemNames}"` : "your bag"} at our store.`,
      ``,
      `Would you like us to confirm delivery and reserve your pieces? Reply here and we will arrange your dispatch right away.`,
    ].join("\n");
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Back to Orders
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Abandoned Checkouts ({leads.length})
          </h1>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-border p-4 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-semibold text-foreground">No abandoned checkouts</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              When shoppers type their phone number in checkout but exit without confirming, their contact details and bag items will appear here for 1-click recovery!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items in Bag</th>
                  <th className="py-3 px-4">Cart Value</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => {
                  const items = Array.isArray(lead.cart_items) ? lead.cart_items : [];
                  return (
                    <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">{formatDate(lead.created_at)}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{lead.customer_name || "Guest Visitor"}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{lead.customer_phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-foreground">
                        {items.length > 0 ? (
                          items.map((it, idx) => (
                            <span key={idx} className="inline-block mr-2 text-[11px] bg-muted px-2 py-0.5 rounded">{it.quantity || 1}x {it.productName || "Piece"}</span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">1 item</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">{CURRENCY_SYMBOL} {Number(lead.subtotal).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <a href={getRecoveryWhatsAppUrl(lead)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                          Recover via WhatsApp
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
