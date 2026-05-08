import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getAiServerBaseUrl } from "@/lib/serverEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const AI_SERVER = getAiServerBaseUrl();
    const { searchParams } = new URL(req.url);
    const cameraId = searchParams.get("camera_id");

    if (!cameraId) {
      return NextResponse.json(
        { detail: "Missing camera_id" },
        { status: 400 }
      );
    }

    const upstream = await fetch(
      `${AI_SERVER}/events/save?camera_id=${encodeURIComponent(cameraId)}`,
      {
        method: "POST",
        cache: "no-store",
      }
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
      { detail: getErrorMessage(error) },
      { status: 502 }
    );
  }
}
