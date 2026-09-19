import { createClient } from "@/lib/supabase/client";
import { CURRENT_STORE_ID } from "@/lib/zedwix-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, total_price, subtotal, discount_amount, fulfillment_status, payment_status, created_at")
    .eq("store_id", CURRENT_STORE_ID)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: itemsData } = await supabase
    .from("order_items")
    .select("product_name, quantity, price, line_total")
    .eq("store_id", CURRENT_STORE_ID);

  const orders = data || [];
  const items = itemsData || [];

  const nonCancelled = orders.filter((o: any) => o.fulfillment_status !== "cancelled");
  const completed = orders.filter((o: any) => o.fulfillment_status === "delivered");
  const netSales = nonCancelled.reduce((s: number, o: any) => s + Number(o.total_price), 0);
  const totalOrders = nonCancelled.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(netSales / totalOrders) : 0;
  const deliveryRate = orders.length > 0 ? Math.round((completed.length / orders.length) * 100) : 0;

  const now = new Date();
  const dailyRevenue: { date: string; label: string; amount: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOrders = nonCancelled.filter((o: any) => o.created_at.startsWith(dateStr));
    const amount = dayOrders.reduce((s: number, o: any) => s + Number(o.total_price), 0);
    dailyRevenue.push({
      date: dateStr,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      amount,
      count: dayOrders.length,
    });
  }

  const productAgg: Record<string, { units: number; revenue: number }> = {};
  items.forEach((it: any) => {
    const name = it.product_name || "Unknown";
    if (!productAgg[name]) productAgg[name] = { units: 0, revenue: 0 };
    productAgg[name].units += it.quantity || 1;
    productAgg[name].revenue += Number(it.line_total || it.price * (it.quantity || 1));
  });

  const topProducts = Object.entries(productAgg)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return NextResponse.json({
    metrics: {
      netSales,
      totalOrders,
      averageOrderValue: avgOrderValue,
      completionRate: deliveryRate,
      dailyRevenue,
      topProducts,
    },
  });
}
