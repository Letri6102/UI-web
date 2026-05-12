import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getAiServerBaseUrl } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const AI_SERVER = getAiServerBaseUrl();
    const body = await req.text();
    const upstream = await fetch(`${AI_SERVER}/review-auth/login`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body,
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, detail: getErrorMessage(error) }, { status: 502 });
  }
}
