"use server";

import { slugify } from "@/lib/slugify";
import type { ProductFormData } from "@/lib/types";
import { getCurrentStoreId } from "@/lib/zedwix-store";
import { createClient } from "@/lib/supabase/client";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

export async function saveProductAction(data: ProductFormData): Promise<ActionResult & { productId?: string }> {
  try {
    const storeId = await getCurrentStoreId();
    const supabase = createClient();

    if (!data.name.trim()) return { success: false, error: "Product name is required" };
    if (data.price < 0) return { success: false, error: "Price cannot be negative" };

    const slug = slugify(data.name);

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        store_id: storeId,
        category_id: data.categoryId || null,
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        price: data.price,
        sale_price: data.salePrice,
        stock_tracking_enabled: data.stockTrackingEnabled,
        stock_quantity: data.stockQuantity,
        status: data.status,
      })
      .select()
      .single();

    if (error || !product) return { success: false, error: error?.message || "Failed to create product" };

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard");
    return { success: true, productId: product.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateProductAction(data: ProductFormData & { id: string }): Promise<ActionResult> {
  try {
    const storeId = await getCurrentStoreId();
    const supabase = createClient();

    if (!data.name.trim()) return { success: false, error: "Product name is required" };
    if (data.price < 0) return { success: false, error: "Price cannot be negative" };

    const slug = slugify(data.name);

    const { error } = await supabase
      .from("products")
      .update({
        category_id: data.categoryId || null,
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        price: data.price,
        sale_price: data.salePrice,
        stock_tracking_enabled: data.stockTrackingEnabled,
        stock_quantity: data.stockQuantity,
        status: data.status,
      })
      .eq("id", data.id)
      .eq("store_id", storeId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  try {
    const storeId = await getCurrentStoreId();
    const supabase = createClient();

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("store_id", storeId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleProductStatusAction(productId: string, status: "published" | "draft"): Promise<ActionResult> {
  try {
    const storeId = await getCurrentStoreId();
    const supabase = createClient();

    const { error } = await supabase
      .from("products")
      .update({ status })
      .eq("id", productId)
      .eq("store_id", storeId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
