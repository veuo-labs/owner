import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { name, whatsappNumber, contactNumber, instagramUrl } = body;

    const supabase = createAdminClient();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updatePayload.name = String(name).trim();
    if (whatsappNumber !== undefined) updatePayload.whatsapp_number = whatsappNumber ? String(whatsappNumber).trim() : null;
    if (contactNumber !== undefined) updatePayload.contact_number = contactNumber ? String(contactNumber).trim() : null;
    if (instagramUrl !== undefined) updatePayload.instagram_url = instagramUrl ? String(instagramUrl).trim() : null;

    const { data: updated, error } = await supabase
      .from("stores")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, store: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
