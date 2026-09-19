import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Fetch stores
    const { data: stores, error: storesError } = await supabase
      .from("stores")
      .select("id, name, slug, whatsapp_number, instagram_url, contact_number, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (storesError) throw storesError;

    // 2. Fetch profiles to map store_id -> user_id
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, store_id");

    // 3. Fetch auth users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const userMap = new Map<string, string>();
    if (authData?.users) {
      authData.users.forEach((u) => {
        if (u.email) userMap.set(u.id, u.email);
      });
    }

    const storeOwnerMap = new Map<string, { email: string; id: string }>();
    if (profiles) {
      profiles.forEach((p) => {
        const email = userMap.get(p.user_id);
        if (email) {
          storeOwnerMap.set(p.store_id, { email, id: p.user_id });
        }
      });
    }

    // 4. Fetch product counts per store
    const { data: products } = await supabase.from("products").select("store_id");
    const productCountMap = new Map<string, number>();
    if (products) {
      products.forEach((p) => {
        productCountMap.set(p.store_id, (productCountMap.get(p.store_id) || 0) + 1);
      });
    }

    const enrichedStores = (stores || []).map((store) => {
      const owner = storeOwnerMap.get(store.id);
      return {
        ...store,
        ownerEmail: owner?.email || null,
        ownerId: owner?.id || null,
        productCount: productCountMap.get(store.id) || 0,
      };
    });

    return NextResponse.json({ success: true, stores: enrichedStores });
  } catch (err: any) {
    console.error("GET /api/stores error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, slug, email, password, whatsappNumber, contactNumber, instagramUrl } = body;

    const trimmedName = (name || "").trim();
    const sanitizedSlug = (slug || trimmedName)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedPassword = (password || "").trim();

    if (!trimmedName) {
      return NextResponse.json({ success: false, error: "Store name is required" }, { status: 400 });
    }
    if (!sanitizedSlug) {
      return NextResponse.json({ success: false, error: "Store slug is required" }, { status: 400 });
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid client email is required" }, { status: 400 });
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Check if slug exists
    const { data: existingStore } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", sanitizedSlug)
      .single();

    if (existingStore) {
      return NextResponse.json(
        { success: false, error: `Store with slug "${sanitizedSlug}" already exists.` },
        { status: 409 }
      );
    }

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: trimmedEmail,
      password: trimmedPassword,
      email_confirm: true,
      user_metadata: { store_name: trimmedName, role: "store_owner" },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || "Failed to create client user account." },
        { status: 400 }
      );
    }

    const newUserId = authData.user.id;

    // 3. Create Store record
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .insert({
        name: trimmedName,
        slug: sanitizedSlug,
        whatsapp_number: whatsappNumber ? String(whatsappNumber).trim() : null,
        contact_number: contactNumber ? String(contactNumber).trim() : null,
        instagram_url: instagramUrl ? String(instagramUrl).trim() : null,
      })
      .select()
      .single();

    if (storeError || !storeData) {
      await supabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { success: false, error: `Failed to create store: ${storeError?.message}` },
        { status: 500 }
      );
    }

    // 4. Link User to Store via profiles
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: newUserId,
        store_id: storeData.id,
      },
      { onConflict: "user_id" }
    );

    if (profileError) {
      console.warn("Profile link warning:", profileError);
    }

    // Broadcast creation to live realtime channel
    try {
      const channel = supabase.channel("zedwix-owner-live");
      channel.send({
        type: "broadcast",
        event: "STORE_CREATED",
        payload: {
          storeId: storeData.id,
          storeName: storeData.name,
          slug: storeData.slug,
          ownerEmail: trimmedEmail,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      store: storeData,
      credentials: {
        storeName: trimmedName,
        slug: sanitizedSlug,
        email: trimmedEmail,
        password: trimmedPassword,
      },
    });
  } catch (err: any) {
    console.error("POST /api/stores error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ success: false, error: "Missing storeId" }, { status: 400 });
    }

    // Safety check: protect default store
    const PROTECTED_STORE_ID = "00000000-0000-0000-0000-000000000001";
    if (storeId === PROTECTED_STORE_ID) {
      return NextResponse.json(
        { success: false, error: "Cannot delete the default system store." },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // 1. Get associated auth users from profiles (excluding admin accounts)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("store_id", storeId);

    // 2. Delete store record (cascades to products, categories, variants, profiles)
    const { error: deleteError } = await supabase
      .from("stores")
      .delete()
      .eq("id", storeId);

    if (deleteError) throw deleteError;

    // 3. Delete client auth user accounts
    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        try {
          const { data: u } = await supabase.auth.admin.getUserById(p.user_id);
          if (u?.user?.email !== "admin@zedwix.com") {
            await supabase.auth.admin.deleteUser(p.user_id);
          }
        } catch (e) {}
      }
    }

    // Broadcast deletion
    try {
      const channel = supabase.channel("zedwix-owner-live");
      channel.send({
        type: "broadcast",
        event: "STORE_DELETED",
        payload: { storeId },
      });
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/stores error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
