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
    const eventType = url.searchParams.get("event_type");
    const source = url.searchParams.get("source");
    const reviewStatus = url.searchParams.get("review_status");
    const query = url.searchParams.get("q");
    const limit = url.searchParams.get("limit") || "100";
    const offset = url.searchParams.get("offset") || "0";

    const upstreamUrl = new URL(`${AI_SERVER}/events`);
    upstreamUrl.searchParams.set("limit", limit);
    upstreamUrl.searchParams.set("offset", offset);
    if (cameraId) upstreamUrl.searchParams.set("camera_id", cameraId);
    if (eventType) upstreamUrl.searchParams.set("event_type", eventType);
    if (source) upstreamUrl.searchParams.set("source", source);
    if (reviewStatus) upstreamUrl.searchParams.set("review_status", reviewStatus);
    if (query) upstreamUrl.searchParams.set("q", query);

    const upstream = await fetch(upstreamUrl.toString(), {
      cache: "no-store",
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
    return NextResponse.json(
      {
        status: "error",
        items: [],
        detail: getErrorMessage(error),
      },
      { status: 502 }
    );
  }
}
