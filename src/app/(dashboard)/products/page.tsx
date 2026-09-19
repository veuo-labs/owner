"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StockBadge } from "@/components/stock-badge";
import { ProductActions } from "@/components/product-actions";
import { Pagination } from "@/components/pagination";
import { deleteProductAction, toggleProductStatusAction } from "@/app/api/products/actions";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { fetchLiveOrders } from "@/lib/zedwix-store";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function loadProducts() {
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      setProducts(json.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchQ = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase());
    const matchS = !filterStatus || p.status === filterStatus;
    return matchQ && matchS;
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const res = await deleteProductAction(id);
    if (res.success) loadProducts();
  }

  async function handleToggleStatus(id: string, status: "published" | "draft") {
    const res = await toggleProductStatusAction(id, status);
    if (res.success) loadProducts();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Add product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search products..."
          className="flex-1 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground mb-4">No products found.</p>
          <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            Add product
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border divide-y divide-border">
            {filtered.map((product) => (
              <div key={product.id} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors">
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {CURRENCY_SYMBOL} {Number(product.sale_price ?? product.price).toLocaleString()}
                  </p>
                </Link>
                <StockBadge quantity={product.stock_quantity} trackingEnabled={product.stock_tracking_enabled} />
                <span className={`text-xs px-2 py-0.5 rounded-full ${product.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {product.status === "published" ? "Published" : "Draft"}
                </span>
                <ProductActions
                  productId={product.id}
                  productName={product.name}
                  status={product.status}
                  stockQuantity={product.stock_quantity}
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(product.id, product.status === "published" ? "draft" : "published")}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                    title="Toggle status"
                  >
                    {product.status === "published" ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-xs text-destructive hover:text-red-600 px-2 py-1"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={1} pageSize={25} totalItems={filtered.length} />
        </>
      )}
    </div>
  );
}
