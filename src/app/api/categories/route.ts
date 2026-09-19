import { createClient } from "@/lib/supabase/client";
import { CURRENT_STORE_ID } from "@/lib/zedwix-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", CURRENT_STORE_ID)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { name, slug } = body;

  const { data, error } = await supabase
    .from("categories")
    .insert({ store_id: CURRENT_STORE_ID, name, slug })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function PUT(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { id, name, slug } = body;

  const { data, error } = await supabase
    .from("categories")
    .update({ name, slug })
    .eq("id", id)
    .eq("store_id", CURRENT_STORE_ID)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("store_id", CURRENT_STORE_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
