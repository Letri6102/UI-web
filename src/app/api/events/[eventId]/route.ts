import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getAiServerBaseUrl } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const AI_SERVER = getAiServerBaseUrl();
    const { eventId } = await context.params;
    const body = await req.text();

    const upstream = await fetch(`${AI_SERVER}/events/${encodeURIComponent(eventId)}`, {
      method: "PATCH",
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
    return NextResponse.json(
      { detail: getErrorMessage(error) },
      { status: 502 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const AI_SERVER = getAiServerBaseUrl();
    const { eventId } = await context.params;

    const upstream = await fetch(`${AI_SERVER}/events/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
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
      { detail: getErrorMessage(error) },
      { status: 502 }
    );
  }
}
