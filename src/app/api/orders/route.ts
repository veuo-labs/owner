import { createClient } from "@/lib/supabase/client";
import { CURRENT_STORE_ID } from "@/lib/zedwix-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", CURRENT_STORE_ID)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { customer_name, customer_phone, customer_email, shipping_address, city, province, postal_code, order_notes, subtotal, shipping_fee, discount_amount, total_price, payment_method, payment_status, fulfillment_status, courier_name, tracking_number, coupon_code, items } = body;

  const { data: orderNum } = await supabase
    .from("orders")
    .select("order_number")
    .eq("store_id", CURRENT_STORE_ID)
    .order("order_number", { ascending: false })
    .limit(1)
    .single();

  const nextOrderNum = (orderNum?.order_number || 0) + 1;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      store_id: CURRENT_STORE_ID,
      order_number: nextOrderNum,
      order_code: `ORD-${nextOrderNum.toString().padStart(4, "0")}`,
      customer_name,
      customer_phone,
      customer_email,
      shipping_address,
      city,
      province,
      postal_code,
      order_notes,
      subtotal,
      shipping_fee,
      discount_amount,
      total_price,
      payment_method,
      payment_status,
      fulfillment_status,
      courier_name,
      tracking_number,
      coupon_code,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (items && items.length > 0) {
    const itemRows = items.map((it: any) => ({
      store_id: CURRENT_STORE_ID,
      order_id: data.id,
      product_id: it.productId || null,
      variant_id: it.variantId || null,
      product_name: it.productName || "",
      variant_name: it.variantName || null,
      sku: null,
      price: it.price || 0,
      quantity: it.quantity || 1,
      image_url: null,
      line_total: (it.price || 0) * (it.quantity || 1),
    }));
    await supabase.from("order_items").insert(itemRows);
  }

  return NextResponse.json({ order: data });
}

export async function PUT(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .eq("store_id", CURRENT_STORE_ID)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
