import { NextResponse } from "next/server";

/** Lightweight probe for Firebase App Hosting / Cloud Run (see apphosting.yaml). */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
