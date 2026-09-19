"use client";

import { useEffect, useState } from "react";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { redirect } from "next/navigation";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadMetrics() {
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      setMetrics(json.metrics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading || !metrics) {
    return <div className="text-center py-20 text-muted-foreground">Loading analytics...</div>;
  }

  const maxDaily = Math.max(1, ...metrics.dailyRevenue.map((d: any) => d.amount));
  const chartPoints = metrics.dailyRevenue
    .map((d: any, idx: number) => {
      const x = 40 + idx * 85;
      const y = 160 - (d.amount / maxDaily) * 130;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales & Revenue Analytics</h1>
        <p className="text-sm text-muted-foreground">Real-time commerce telemetry, average order volume, and catalog velocity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Sales</div>
          <div className="text-2xl font-bold text-foreground mt-2">{CURRENCY_SYMBOL} {metrics.netSales.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total collected & confirmed</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Orders</div>
          <div className="text-2xl font-bold text-foreground mt-2">{metrics.totalOrders}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Active customer checkouts</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average Order Value</div>
          <div className="text-2xl font-bold text-foreground mt-2">{CURRENCY_SYMBOL} {metrics.averageOrderValue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Mean checkout cart spend</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Success</div>
          <div className="text-2xl font-bold text-emerald-500 mt-2">{metrics.completionRate}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">Orders completed</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">7-Day Revenue Trajectory</h3>
            <p className="text-xs text-muted-foreground">Daily gross volume across all customer checkouts</p>
          </div>
          <span className="text-xs font-mono font-bold text-primary">Peak: {CURRENCY_SYMBOL} {maxDaily.toLocaleString()}</span>
        </div>
        <div className="w-full h-56 pt-2">
          <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
            <line x1="20" y1="40" x2="580" y2="40" stroke="currentColor" className="text-border/40" strokeDasharray="3,3" />
            <line x1="20" y1="100" x2="580" y2="100" stroke="currentColor" className="text-border/40" strokeDasharray="3,3" />
            <line x1="20" y1="160" x2="580" y2="160" stroke="currentColor" className="text-border/80" />
            <polygon points={`40,160 ${chartPoints} 550,160`} className="fill-primary/10" />
            <polyline fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={chartPoints} />
            {metrics.dailyRevenue.map((d: any, idx: number) => {
              const x = 40 + idx * 85;
              const y = 160 - (d.amount / maxDaily) * 130;
              return (
                <g key={d.date}>
                  <circle cx={x} cy={y} r="4.5" className="fill-background stroke-primary stroke-[2.5]" />
                  <text x={x} y="185" textAnchor="middle" className="text-[11px] fill-muted-foreground font-mono">{d.label}</text>
                  {d.amount > 0 && (
                    <text x={x} y={y - 10} textAnchor="middle" className="text-[10px] fill-foreground font-bold font-mono">
                      {Math.round(d.amount / 1000)}k
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Top Performing Pieces</h3>
        {metrics.topProducts.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">No product sales recorded yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {metrics.topProducts.map((prod: any, idx: number) => {
              const share = metrics.netSales > 0 ? Math.round((prod.revenue / metrics.netSales) * 100) : 0;
              return (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-mono font-bold text-muted-foreground">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-foreground">{prod.name}</div>
                      <div className="text-muted-foreground text-[11px]">{prod.unitsSold} units sold</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground font-mono">{CURRENCY_SYMBOL} {prod.revenue.toLocaleString()}</div>
                    <div className="text-muted-foreground text-[11px]">{share}% of sales</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
