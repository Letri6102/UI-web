import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getAiServerBaseUrl } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const AI_SERVER = getAiServerBaseUrl();
    const { eventId } = await context.params;

    const upstream = await fetch(`${AI_SERVER}/events/${encodeURIComponent(eventId)}/image`, {
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return new NextResponse(text || "Image not found", {
        status: upstream.status || 404,
      });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    return new NextResponse(getErrorMessage(error), { status: 502 });
  }
}
