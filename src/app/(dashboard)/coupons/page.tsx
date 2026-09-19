"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { createCouponAction, toggleCouponAction, deleteCouponAction } from "@/app/api/coupons/actions";
import { CouponManager } from "./coupon-manager";
import type { Coupon } from "@/lib/types";

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCoupons() {
    try {
      const res = await fetch("/api/coupons");
      const json = await res.json();
      setCoupons(json.coupons || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function handleCreate(data: {
    code: string;
    discountType: string;
    discountValue: number;
    minOrderAmount: number;
    usageLimit: number | null;
  }) {
    setLoading(true);
    const res = await createCouponAction(data);
    setLoading(false);
    if (res.success) {
      loadCoupons();
    }
  }

  async function handleToggle(coupon: Coupon) {
    const res = await toggleCouponAction(coupon.id, coupon.is_active);
    if (res.success) loadCoupons();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon?")) return;
    const res = await deleteCouponAction(id);
    if (res.success) loadCoupons();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Discount Codes & Coupons</h1>
          <p className="text-sm text-muted-foreground">Create promotional codes, flash sales, and customer percentage discounts.</p>
        </div>
        <CouponManager onSave={handleCreate} coupons={coupons} />
      </div>
    </div>
  );
}
