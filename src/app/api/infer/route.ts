import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { getAiServerBaseUrl } from "@/lib/serverEnv";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const AI_SERVER = getAiServerBaseUrl();
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, where: "validation", message: "Missing file" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          ok: false,
          where: "validation",
          message: "Only image files are supported in quick review.",
        },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const image_b64 = bytes.toString("base64");

    const upstream = await fetch(`${AI_SERVER}/infer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_b64,
        return_annotated: true,
        jpeg_quality: 85,
      }),
      cache: "no-store",
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, where: "ai_server", status: upstream.status, body: text },
        { status: 502 }
      );
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json({ ok: true, ...data });
    } catch {
      return NextResponse.json(
        { ok: false, where: "proxy_parse", body: text },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, where: "proxy_exception", message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
