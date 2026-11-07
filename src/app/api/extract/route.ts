import { NextResponse } from "next/server";
import { extractLetter } from "@/lib/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  if (!TYPES.includes(file.type)) return NextResponse.json({ error: "bad_type" }, { status: 415 });
  try {
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const result = await extractLetter({ data, mimeType: file.type });
    // The image is never stored; only the extracted fields go back to the browser.
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (e) {
    console.error("extract failed", e);
    return NextResponse.json({ ok: false, error: "service_busy" }, { status: 503 });
  }
}
