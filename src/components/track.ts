/** Fire-and-forget anonymous counter. Sends only the event name, language and reason type. */
export function track(event: string, lang?: string, reasonId?: string) {
  try {
    void fetch("/api/event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event, lang, reasonId }), keepalive: true });
  } catch {}
}
