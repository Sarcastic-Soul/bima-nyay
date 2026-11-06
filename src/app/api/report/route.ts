import { z } from "zod";
import { runAgent } from "@/lib/agent";
import { LetterFields } from "@/lib/letter";
import { findOffice } from "@/lib/ombudsman/offices";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  fields: LetterFields,
  grievanceSentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  grievanceReplyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  state: z.string().max(60).optional(),
  district: z.string().max(60).optional(),
});

const todayIST = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

/** Streams agent events as NDJSON so the page can show each step as it happens. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_input", issues: parsed.error.issues }, { status: 400 });
  const input = { ...parsed.data, today: todayIST() };
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (o: unknown) => ctrl.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      send({ type: "start", today: input.today });
      try {
        for await (const ev of runAgent(input, { route: (s, d) => findOffice(s, d) })) send(ev);
      } catch (e) {
        console.error("agent failed", e);
        send({ type: "error", message: "service_busy" });
      }
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
