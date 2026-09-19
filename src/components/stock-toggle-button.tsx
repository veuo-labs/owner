"use client";

interface StockToggleButtonProps {
  productId: string;
  quantity: number;
  trackingEnabled: boolean;
  onToggle?: () => void;
}

export function StockToggleButton({ quantity, trackingEnabled, onToggle }: StockToggleButtonProps) {
  const hasPositiveStock = trackingEnabled ? quantity > 0 : true;

  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
        hasPositiveStock
          ? "bg-emerald-500/10 text-emerald-500"
          : "bg-red-500/10 text-red-500"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {hasPositiveStock ? "In Stock" : "Out of Stock"}
    </button>
  );
}
