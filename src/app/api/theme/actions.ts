"use server";

import { createClient } from "@/lib/supabase/client";
import { CURRENT_STORE_ID } from "@/lib/zedwix-store";
import { DEFAULT_THEME_CONFIG } from "@/lib/theme-defaults";
import type { ThemeConfig } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getThemeData(): Promise<{
  themeConfig: ThemeConfig;
  products: { id: string; name: string; slug: string; price: number; salePrice?: number | null; imageUrl?: string }[];
  storeName: string;
  storeSlug: string;
}> {
  try {
    const storeId = CURRENT_STORE_ID;
    const supabase = createClient();

    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("name, slug, theme_config")
      .eq("id", storeId)
      .single();

    const themeConfig: ThemeConfig = (store as any)?.theme_config || DEFAULT_THEME_CONFIG;

    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, slug, price, sale_price")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    const products = (productsData || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price) || 0,
      salePrice: p.sale_price ? Number(p.sale_price) : null,
    }));

    return {
      themeConfig,
      products,
      storeName: store?.name || "My Store",
      storeSlug: store?.slug || "store",
    };
  } catch (err: any) {
    return {
      themeConfig: DEFAULT_THEME_CONFIG,
      products: [],
      storeName: "",
      storeSlug: "",
    };
  }
}

export async function saveThemeData(config: ThemeConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const storeId = CURRENT_STORE_ID;
    const supabase = createClient();

    const { data: storeData } = await supabase
      .from("stores")
      .select("theme_config")
      .eq("id", storeId)
      .single();

    const existingTc = (storeData?.theme_config as Record<string, any>) || {};
    const mergedConfig = {
      ...existingTc,
      ...config,
      shipping: config.shipping || existingTc.shipping,
    };

    const { error: updateErr } = await supabase
      .from("stores")
      .update({ theme_config: mergedConfig, updated_at: new Date().toISOString() })
      .eq("id", storeId);

    if (updateErr) return { success: false, error: updateErr.message };

    if (config.hero.featuredProductId) {
      await supabase.from("products").update({ is_hero: false }).eq("store_id", storeId);
      await supabase.from("products").update({ is_hero: true }).eq("id", config.hero.featuredProductId).eq("store_id", storeId);
    }

    revalidatePath("/dashboard/theme");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
