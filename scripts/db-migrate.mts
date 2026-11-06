
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");
const sql = neon(url);

const statements = readFileSync("src/lib/db/schema.sql", "utf8")
  .split(/;\s*\n/)
  .map((s) => s.replace(/--.*$/gm, "").trim())
  .filter(Boolean);

for (const s of statements) await sql.query(s);
const tables = await sql.query("select table_name from information_schema.tables where table_schema = 'public' order by 1");
console.log("ok:", tables.map((t) => t.table_name).join(", "));
