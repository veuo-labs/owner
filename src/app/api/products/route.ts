import { createClient } from "@/lib/supabase/client";
import { CURRENT_STORE_ID } from "@/lib/zedwix-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", CURRENT_STORE_ID)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { name, slug, description, price, sale_price, stock_tracking_enabled, stock_quantity, status, category_id } = body;

  const { data, error } = await supabase
    .from("products")
    .insert({
      store_id: CURRENT_STORE_ID,
      name,
      slug,
      description,
      price,
      sale_price,
      stock_tracking_enabled,
      stock_quantity,
      status,
      category_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function PUT(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { id, name, slug, description, price, sale_price, stock_tracking_enabled, stock_quantity, status, category_id } = body;

  const { data, error } = await supabase
    .from("products")
    .update({ name, slug, description, price, sale_price, stock_tracking_enabled, stock_quantity, status, category_id })
    .eq("id", id)
    .eq("store_id", CURRENT_STORE_ID)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("store_id", CURRENT_STORE_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
