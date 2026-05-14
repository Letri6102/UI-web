import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getAiServerBaseUrl } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(req: Request, context: RouteContext) {
  try {
    const AI_SERVER = getAiServerBaseUrl();
    const { eventId } = await context.params;
    const range = req.headers.get("range");

    const upstream = await fetch(`${AI_SERVER}/events/${encodeURIComponent(eventId)}/clip`, {
      cache: "no-store",
      headers: range
        ? {
            Range: range,
          }
        : undefined,
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return new NextResponse(text || "Clip not found", {
        status: upstream.status || 404,
      });
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") || "video/mp4");
    headers.set("Cache-Control", "no-store");
    headers.set("Accept-Ranges", upstream.headers.get("accept-ranges") || "bytes");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);

    const disposition = upstream.headers.get("content-disposition");
    if (disposition) {
      headers.set("Content-Disposition", disposition);
    } else {
      headers.set("Content-Disposition", "inline");
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error: unknown) {
    return new NextResponse(getErrorMessage(error), { status: 502 });
  }
}
