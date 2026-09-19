import { createClient } from "./supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadOptimizedImage(
  supabase: SupabaseClient,
  buffer: Buffer,
  storeId: string,
  productId: string,
  fileName: string
): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  try {
    const storagePath = `stores/${storeId}/products/${productId}/${fileName}`;
    const { error } = await supabase.storage.from("products").upload(storagePath, buffer, {
      contentType: "image/webp",
      upsert: false,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, storagePath };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteStorageFile(path: string, supabase: SupabaseClient): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from("products").remove([path]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteManyStorageFiles(paths: string[], supabase: SupabaseClient): Promise<void> {
  if (paths.length === 0) return;
  const batches: string[][] = [];
  for (let i = 0; i < paths.length; i += 50) {
    batches.push(paths.slice(i, i + 50));
  }
  for (const batch of batches) {
    try {
      await supabase.storage.from("products").remove(batch);
    } catch (e) {
      console.error("Storage delete error:", e);
    }
  }
}

export function resolvePublicImageUrl(storagePath: string, supabase: SupabaseClient): string | null {
  try {
    const { data } = supabase.storage.from("products").getPublicUrl(storagePath);
    return data.publicUrl || null;
  } catch {
    return null;
  }
}
