"use server";

import { createClient } from "@/lib/supabase/client";
import { getCurrentStoreId } from "@/lib/zedwix-store";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

export async function createCouponAction(input: {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  usageLimit?: number | null;
}): Promise<ActionResult> {
  try {
    const storeId = await getCurrentStoreId();
    const supabase = createClient();

    const { error } = await supabase.from("coupons").insert({
      store_id: storeId,
      code: input.code.toUpperCase(),
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order_amount: input.minOrderAmount || 0,
      usage_limit: input.usageLimit || null,
      is_active: true,
      times_used: 0,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/coupons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleCouponAction(couponId: string, currentStatus: boolean): Promise<ActionResult> {
  try {
    const storeId = await getCurrentStoreId();
    const supabase = createClient();

    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !currentStatus })
      .eq("id", couponId)
      .eq("store_id", storeId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/coupons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCouponAction(couponId: string): Promise<ActionResult> {
  try {
    const storeId = await getCurrentStoreId();
    const supabase = createClient();

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", couponId)
      .eq("store_id", storeId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/coupons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
