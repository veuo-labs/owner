"use client";

interface StockBadgeProps {
  quantity: number;
  trackingEnabled: boolean;
}

export function StockBadge({ quantity, trackingEnabled }: StockBadgeProps) {
  if (!trackingEnabled) return null;
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-500">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Out of Stock
      </span>
    );
  }
  if (quantity <= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      In Stock
    </span>
  );
}
