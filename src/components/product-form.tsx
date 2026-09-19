"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProductFormData } from "@/lib/types";
import { saveProductAction, updateProductAction } from "@/app/api/products/actions";

interface ProductFormProps {
  categories?: { id: string; name: string; slug: string }[];
  product?: Partial<ProductFormData> & { id?: string };
  variants?: { id?: string; name: string; stockQuantity: number }[];
  images?: { id: string; url?: string | null; storage_path?: string; alt_text?: string | null; sort_order: number }[];
  mode: "create" | "edit";
}

export function ProductForm({ categories = [], product, variants = [], images = [], mode }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialData: ProductFormData = {
    name: product?.name || "",
    price: product?.price || 0,
    salePrice: product?.salePrice ?? null,
    categoryId: product?.categoryId || "",
    description: product?.description || null,
    stockTrackingEnabled: product?.stockTrackingEnabled !== undefined ? product.stockTrackingEnabled : true,
    stockQuantity: product?.stockQuantity || 0,
    status: product?.status || "draft",
    variants: variants.length > 0 ? variants : [{ name: "Default", stockQuantity: 0 }],
  };

  const [formData, setFormData] = useState<ProductFormData>(initialData);

  function updateField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (mode === "create") {
          const res = await saveProductAction(formData);
          if (res.success) router.push("/dashboard/products");
        } else {
          const res = await updateProductAction({ id: product!.id!, ...formData });
          if (res.success) router.push("/dashboard/products");
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Premium Cotton Shirt"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price (Rs.)</label>
          <input
            type="number"
            required
            min="0"
            value={formData.price}
            onChange={(e) => updateField("price", Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sale Price (Rs.)</label>
          <input
            type="number"
            min="0"
            value={formData.salePrice ?? ""}
            onChange={(e) => updateField("salePrice", e.target.value ? Number(e.target.value) : null)}
            placeholder="No sale price"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={formData.categoryId || ""}
            onChange={(e) => updateField("categoryId", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">No Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => updateField("status", e.target.value as "published" | "draft")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stock Quantity</label>
          <input
            type="number"
            min="0"
            value={formData.stockQuantity}
            onChange={(e) => updateField("stockQuantity", Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="stockTracking"
            checked={formData.stockTrackingEnabled}
            onChange={(e) => updateField("stockTrackingEnabled", e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="stockTracking" className="text-sm">Enable Stock Tracking</label>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={4}
            value={formData.description || ""}
            onChange={(e) => updateField("description", e.target.value || null)}
            placeholder="Product description..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold mb-3">Variants</h3>
        <div className="space-y-2">
          {formData.variants.map((v, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                placeholder="Variant name"
                value={v.name}
                onChange={(e) => {
                  const next = [...formData.variants];
                  next[idx] = { ...next[idx], name: e.target.value };
                  updateField("variants", next);
                }}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <input
                type="number"
                min="0"
                placeholder="Stock"
                value={v.stockQuantity}
                onChange={(e) => {
                  const next = [...formData.variants];
                  next[idx] = { ...next[idx], stockQuantity: Number(e.target.value) };
                  updateField("variants", next);
                }}
                className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : mode === "create" ? "Create Product" : "Update Product"}
        </button>
      </div>
    </form>
  );
}
