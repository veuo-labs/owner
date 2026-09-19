import { createClient } from "@/lib/supabase/client";
import { CURRENT_STORE_ID } from "@/lib/zedwix-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("store_id", CURRENT_STORE_ID)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { code, discount_type, discount_value, min_order_amount, usage_limit, expires_at, is_active } = body;

  const { data, error } = await supabase
    .from("coupons")
    .insert({
      store_id: CURRENT_STORE_ID,
      code,
      discount_type,
      discount_value,
      min_order_amount,
      usage_limit,
      expires_at,
      is_active,
      times_used: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

export async function PUT(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from("coupons")
    .update(updates)
    .eq("id", id)
    .eq("store_id", CURRENT_STORE_ID)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", id)
    .eq("store_id", CURRENT_STORE_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
