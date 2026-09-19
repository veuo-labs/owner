"use client";

interface ProductActionsProps {
  productId: string;
  productName: string;
  status: string;
  stockQuantity: number;
}

export function ProductActions({ productId, productName, status, stockQuantity }: ProductActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
        }`}
      >
        {status === "published" ? "Published" : "Draft"}
      </span>
      <button
        onClick={() => {}}
        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
        title="Edit"
      >
        ✎
      </button>
      <button
        onClick={() => {}}
        className="text-xs text-destructive hover:text-red-600 px-2 py-1"
        title="Delete"
      >
        ✕
      </button>
    </div>
  );
}
