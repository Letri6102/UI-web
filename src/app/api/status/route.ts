import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getAiServerBaseUrl } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cameraId = searchParams.get("camera_id");

  try {
    const AI_SERVER = getAiServerBaseUrl();
    const upstream = await fetch(
      `${AI_SERVER}/status?camera_id=${encodeURIComponent(cameraId || "")}`,
      { cache: "no-store" }
    );

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        stream_ready: false,
        stream_error: "STREAM_ERROR",
        detail: getErrorMessage(error),
      },
      { status: 502 }
    );
  }
}
