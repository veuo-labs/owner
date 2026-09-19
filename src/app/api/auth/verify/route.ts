import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("zedwix_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }
  const session = getSession();
  if (session && session.token === token) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false });
}
