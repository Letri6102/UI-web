import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getAiServerBaseUrl } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const AI_SERVER = getAiServerBaseUrl();
    const url = new URL(req.url);
    const cameraId = url.searchParams.get("camera_id");
    const upstreamUrl = new URL(`${AI_SERVER}/last_snapshot`);
    if (cameraId) upstreamUrl.searchParams.set("camera_id", cameraId);

    const upstream = await fetch(upstreamUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return new NextResponse(text || "Snapshot not available", {
        status: upstream.status || 404,
      });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error: unknown) {
    return new NextResponse(`Snapshot proxy error: ${getErrorMessage(error)}`, {
      status: 502,
    });
  }
}
