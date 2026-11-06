import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RULES } from "./sources";

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const cache = new Map<string, string>();
const text = (f: string) => {
  if (!cache.has(f)) cache.set(f, norm(readFileSync(join(process.cwd(), "sources", f), "utf8")));
  return cache.get(f)!;
};

describe("rule sources", () => {
  it("has unique ids", () => {
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length);
  });
  it.each(RULES.map((r) => [r.id, r] as const))("%s quote appears word for word in its source", (_id, r) => {
    expect(text(r.file).includes(norm(r.quote))).toBe(true);
  });
  it("every rule links to an official site", () => {
    for (const r of RULES) expect(r.url).toMatch(/^https?:\/\/([a-z0-9-]+\.)*(irdai\.gov\.in|cioins\.co\.in|egazette\.gov\.in|indiacode\.nic\.in)(:\d+)?\//);
  });
});
