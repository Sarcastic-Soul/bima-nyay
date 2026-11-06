-- Bima Nyay database schema (Neon Postgres + pgvector).
create extension if not exists vector;

-- One row per past decision: Ombudsman award (corpus 'gic') or consumer
-- commission order (corpus 'kanoon').
create table if not exists cases (
  id              text primary key,
  corpus          text not null check (corpus in ('gic', 'kanoon')),
  forum           text,            -- e.g. 'Ombudsman Chennai', 'NCDRC', 'State Commission Delhi'
  decided_on      date,
  year            int,
  insurer         text,
  policy_type     text,            -- individual, family floater, group, government scheme, ...
  reason          text,            -- reason taxonomy id (see src/lib/reasons.ts)
  facts           text,            -- short neutral summary of facts
  outcome         text check (outcome in ('allowed', 'partly_allowed', 'dismissed', 'settled', 'other')),
  amount_claimed  numeric,
  amount_awarded  numeric,
  source_url      text,
  source_ref      text,            -- book id / case number for audit
  raw_text        text not null,
  label_source    text,            -- 'gemini' or 'human'
  embedding       vector(768)
);

create index if not exists cases_reason_idx on cases (reason);
create index if not exists cases_year_idx on cases (year);
create index if not exists cases_embedding_idx on cases using hnsw (embedding vector_cosine_ops);

-- Anonymous usage counter for the public /stats page. No personal data.
create table if not exists events (
  id         bigint generated always as identity primary key,
  day        date not null default current_date,
  event      text not null,       -- 'letter_read', 'report_shown', 'letter_downloaded', ...
  lang       text,
  reason_id  text
);

create index if not exists events_day_idx on events (day);
