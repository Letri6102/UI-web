import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getAiServerBaseUrl } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const AI_SERVER = getAiServerBaseUrl();
    const upstream = await fetch(`${AI_SERVER}/cameras`, { cache: "no-store" });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, items: [], detail: getErrorMessage(error) }, { status: 502 });
  }
}
