import { z } from "zod";
import { db } from "@/lib/db";
import { REASON_IDS } from "@/lib/reasons";

export const runtime = "nodejs";

const Body = z.object({
  event: z.enum(["letter_read", "report_shown", "letter_copied", "letter_downloaded", "sample_used", "whatsapp_shared", "read_aloud", "outcome_ok", "outcome_no", "outcome_wait"]),
  lang: z.enum(["en", "hi"]).optional(),
  reasonId: z.enum(REASON_IDS as [string, ...string[]]).optional(),
});

/** Anonymous counter for the public /stats page. Stores no personal data. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const { event, lang, reasonId } = parsed.data;
  try {
    await db().query("insert into events (event, lang, reason_id) values ($1, $2, $3)", [event, lang ?? null, reasonId ?? null]);
  } catch (e) {
    console.error("event insert failed", e);
  }
  return Response.json({ ok: true });
}
