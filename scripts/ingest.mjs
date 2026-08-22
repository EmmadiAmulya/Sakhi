#!/usr/bin/env node
/**
 * One-time RAG ingestion: chunk the KB markdown, embed via NIM, store in Supabase.
 * Run from repo root:  node scripts/ingest.mjs
 * Idempotent per document title (re-run replaces that doc's chunks).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

// ponytail: hand-parses .env.local; move to dotenv only if env grows beyond this file.
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
}

const NIM_KEY = process.env.NVIDIA_NIM_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMBED_MODEL = "nvidia/nemotron-3-embed-1b";

if (!NIM_KEY || !SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NVIDIA_NIM_API_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// The knowledge-base docs only — not PRDs/specs.
const FILES = [
  "docs/womens_health_kb_rag.md",
  "docs/womens_daily_health_research.md",
  ...readdirSync("docs/research")
    .filter((f) => f.endsWith(".md"))
    .map((f) => join("docs/research", f)),
];

const MAX_CHUNK = 1500;

/** Split markdown on headings, merge small sections, hard-split oversized ones. */
function chunkMarkdown(text) {
  const sections = text.split(/(?=^#{1,3} )/m).filter((s) => s.trim());
  const chunks = [];
  let buf = "";
  const push = () => {
    if (buf.trim()) chunks.push(buf.trim());
    buf = "";
  };
  for (const s of sections) {
    if (s.length > MAX_CHUNK) {
      push();
      for (let i = 0; i < s.length; i += MAX_CHUNK) chunks.push(s.slice(i, i + MAX_CHUNK).trim());
    } else if ((buf + s).length > MAX_CHUNK) {
      push();
      buf = s;
    } else {
      buf += s;
    }
  }
  push();
  return chunks;
}

async function embed(inputs, inputType) {
  const res = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
    method: "POST",
      headers: { Authorization: `Bearer ${NIM_KEY}`, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ input: inputs, model: EMBED_MODEL, input_type: inputType }),
  });
  if (!res.ok) throw new Error(`embeddings ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function ingestFile(file) {
  const raw = readFileSync(file, "utf8");
  const title = file.replace(/^docs\//, "");
  const chunks = chunkMarkdown(raw);
  console.log(`${title}: ${chunks.length} chunks`);

  // Replace any previous version of this document.
  await admin.from("documents").delete().eq("title", title);
  const { data: doc, error } = await admin
    .from("documents")
    .insert({ title, source: file })
    .select("id")
    .single();
  if (error) throw error;

  const BATCH = 16;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const vectors = await embed(batch, "passage");
    const rows = batch.map((content, j) => ({
      document_id: doc.id,
      content,
      embedding: JSON.stringify(vectors[j]),
    }));
    const { error: insErr } = await admin.from("document_chunks").insert(rows);
    if (insErr) throw insErr;
    console.log(`  embedded+stored ${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
  }
}

try {
  for (const f of FILES) await ingestFile(f);
  const { count } = await admin.from("document_chunks").select("*", { count: "exact", head: true });
  console.log(`Done. document_chunks total: ${count}`);

  // Self-check: retrieval must surface cycle-related content for a health query.
  const [q] = await embed(["Which supplements help with period cramps?"], "query");
  const { data: hits, error: rpcErr } = await admin.rpc("match_document_chunks", {
    query_embedding: q,
    match_count: 3,
  });
  if (rpcErr) throw rpcErr;
  console.log("Self-check top hit similarity:", hits?.[0]?.similarity?.toFixed(4));
  if (!hits?.length || hits[0].similarity < 0.3) {
    console.error("Self-check FAILED: no relevant chunk retrieved.");
    process.exit(1);
  }
  console.log("Self-check passed:", hits[0].content.slice(0, 120), "...");
} catch (err) {
  console.error(err);
  process.exit(1);
}
