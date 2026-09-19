import { createClient } from "@/lib/supabase/client";
import { CURRENT_STORE_ID } from "@/lib/zedwix-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("store_id", CURRENT_STORE_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ variants: data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { product_id, name, stock_quantity } = body;

  const { data, error } = await supabase
    .from("product_variants")
    .insert({ product_id, store_id: CURRENT_STORE_ID, name, stock_quantity })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ variant: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", id)
    .eq("store_id", CURRENT_STORE_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
