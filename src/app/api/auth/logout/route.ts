import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": "zedwix_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      },
    }
  );
}
