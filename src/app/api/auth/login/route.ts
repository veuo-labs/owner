import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSessionToken, saveSession } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!verifyCredentials(email, password)) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const token = createSessionToken();
    saveSession(token);

    return NextResponse.json({ success: true, token });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
