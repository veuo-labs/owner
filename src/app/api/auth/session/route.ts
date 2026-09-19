import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  const elapsed = Date.now() - session.createdAt;
  const remaining = Math.max(0, 60 * 60 * 1000 - elapsed);
  return NextResponse.json({
    authenticated: true,
    expiresIn: remaining,
  });
}
