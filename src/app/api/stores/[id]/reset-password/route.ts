import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await context.params;
    const body = await req.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Look up owner user_id from profiles for this store
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("store_id", storeId)
      .limit(1)
      .single();

    if (!profile || !profile.user_id) {
      return NextResponse.json(
        { success: false, error: "No owner profile found for this store" },
        { status: 404 }
      );
    }

    // 2. Update user's password directly via Auth Admin
    const { error: authError } = await supabase.auth.admin.updateUserById(profile.user_id, {
      password,
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
