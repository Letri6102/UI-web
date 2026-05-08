import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getAiServerBaseUrl } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const AI_SERVER = getAiServerBaseUrl();
    const url = new URL(req.url);
    const cameraId = url.searchParams.get("camera_id");
    const upstreamUrl = new URL(`${AI_SERVER}/video`);
    if (cameraId) upstreamUrl.searchParams.set("camera_id", cameraId);

    const upstream = await fetch(upstreamUrl, {
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return new NextResponse(
        text || "Cannot connect to AI video stream",
        { status: upstream.status || 502 }
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ||
          "multipart/x-mixed-replace; boundary=frame",
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: unknown) {
    return new NextResponse(
      `Video proxy error: ${getErrorMessage(error)}`,
      { status: 502 }
    );
  }
}
