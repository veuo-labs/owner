import { createClient } from "@/lib/supabase/client";
import { CURRENT_STORE_ID } from "@/lib/zedwix-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  let query = supabase.from("product_images").select("*").eq("store_id", CURRENT_STORE_ID);
  if (productId) query = query.eq("product_id", productId);

  const { data, error } = await query.order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { product_id, storage_path, alt_text, sort_order } = body;

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      store_id: CURRENT_STORE_ID,
      product_id,
      storage_path,
      alt_text,
      sort_order,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ image: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", id)
    .eq("store_id", CURRENT_STORE_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
