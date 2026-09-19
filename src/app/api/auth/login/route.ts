import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!verifyCredentials(email, password)) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const token = createSessionToken();

    return NextResponse.json(
      { success: true, token },
      {
        headers: {
          "Set-Cookie": `zedwix_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
