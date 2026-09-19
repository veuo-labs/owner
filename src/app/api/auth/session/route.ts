import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("zedwix_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, token });
}
