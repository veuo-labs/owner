"use client";

import { useState } from "react";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { CouponDiscountType } from "@/lib/types";
import type { Coupon } from "@/lib/types";

interface CouponManagerProps {
  coupons: Coupon[];
  onSave: (data: {
    code: string;
    discountType: CouponDiscountType;
    discountValue: number;
    minOrderAmount: number;
    usageLimit: number | null;
  }) => void;
  onToggle?: (coupon: Coupon) => void;
  onDelete?: (id: string) => void;
}

export function CouponManager({ coupons, onSave, onToggle, onDelete }: CouponManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { setError("Please enter a coupon code"); return; }
    onSave({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
    });
    setShowModal(false);
    setCode("");
    setDiscountValue(10);
    setMinOrderAmount(0);
    setUsageLimit("");
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
      >
        Create Coupon
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Create New Discount Code</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-destructive">{error}</div>
              )}
              <div>
                <label className="font-semibold block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="percentage">Percentage (% Off)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">
                    {discountType === "percentage" ? "Percentage Value (%)" : "Fixed Discount"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Min Order Amount</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = No min"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Blank = Unlimited"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" className="rounded-md bg-primary px-4 py-1.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors">Save Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden mt-4">
        {coupons.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No coupons created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min Order</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      <span className="rounded bg-muted px-2 py-1">{c.code}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `${CURRENCY_SYMBOL} ${Number(c.discount_value).toLocaleString()} OFF`}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {c.min_order_amount > 0 ? `${CURRENCY_SYMBOL} ${Number(c.min_order_amount).toLocaleString()}` : "No Min"}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">{c.times_used} {c.usage_limit ? `/ ${c.usage_limit}` : ""}</td>
                    <td className="py-3.5 px-4">
                      {c.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-500/10 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      {onToggle && (
                        <button onClick={() => onToggle(c)} className="text-[11px] text-muted-foreground hover:text-foreground hover:underline">
                          {c.is_active ? "Disable" : "Enable"}
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(c.id)} className="text-[11px] text-destructive hover:underline">Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
