import { z } from "zod";
import { deterministicEvents, runAgent, type AgentEvent } from "@/lib/agent";
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
      const deps = { route: (s: string, d?: string) => findOffice(s, d) };
      const seen = new Set<string>();
      let failed = false;
      try {
        for await (const ev of runAgent(input, deps)) {
          seen.add(ev.type);
          if (ev.type === "error") failed = true;
          else send(ev);
        }
      } catch (e) {
        console.error("agent failed", e);
        failed = true;
      }
      if (failed) {
        // The model is down or did not finish: still send what plain code can work out.
        try {
          for (const ev of deterministicEvents(input, deps, seen)) send(ev as AgentEvent);
        } catch (e) {
          console.error("fallback failed", e);
        }
        send({ type: "error", message: "service_busy" });
      }
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
