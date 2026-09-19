"use server";

import { getCurrentStoreId } from "@/lib/zedwix-store";
import { createClient } from "@/lib/supabase/client";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export async function categoriesAction(): Promise<{ categories: CategoryItem[]; error?: string }> {
  try {
    const storeId = await getCurrentStoreId();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("store_id", storeId)
      .order("sort_order");

    if (error) return { categories: [], error: error.message };
    return { categories: data || [] };
  } catch (err: any) {
    return { categories: [], error: err.message };
  }
}

export async function createCategoryAction(name: string): Promise<ActionResult> {
  try {
    const storeId = await getCurrentStoreId();
    const supabase = createClient();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const { error } = await supabase
      .from("categories")
      .insert({ store_id: storeId, name, slug })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function productByIdAction(id: string): Promise<{ product: any }> {
  try {
    const storeId = await getCurrentStoreId();
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    return { product: data };
  } catch (err: any) {
    return { product: null };
  }
}
