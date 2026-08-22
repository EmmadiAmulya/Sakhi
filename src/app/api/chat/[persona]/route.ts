import { NextRequest, NextResponse } from "next/server";
import { PERSONAS } from "@/lib/personas";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// ponytail: single fixed model; swap via env if we ever need per-persona models.
const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = process.env.NVIDIA_NIM_MODEL ?? "nvidia/llama-3.3-nemotron-super-49b-v1.5";
const MAX_MESSAGES = 40;
const MAX_CHARS_PER_MESSAGE = 8000;

type ChatMessage = { role: "user" | "assistant"; content: string };

const EMBED_URL = "https://integrate.api.nvidia.com/v1/embeddings";
const EMBED_MODEL = "nvidia/nemotron-3-embed-1b";

/** RAG for Maya: top-k KB chunks for the query. Returns null on any failure — chat degrades gracefully. */
async function retrieveContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  apiKey: string,
  query: string
): Promise<string | null> {
  try {
    const res = await fetch(EMBED_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      body: JSON.stringify({ input: [query], model: EMBED_MODEL, input_type: "query" }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const vector: number[] | undefined = json?.data?.[0]?.embedding;
    if (!Array.isArray(vector)) return null;

    const { data, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: JSON.stringify(vector),
      match_count: 5,
    });
    if (error || !data?.length) return null;
    return data.map((d: { content: string }) => d.content).join("\n\n---\n\n");
  } catch {
    return null;
  }
}

function validateMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  for (const m of input) {
    if (
      !m || typeof m !== "object" ||
      (m as { role?: unknown }).role !== "user" && (m as { role?: unknown }).role !== "assistant" ||
      typeof (m as { content?: unknown }).content !== "string" ||
      !(m as { content: string }).content.trim() ||
      (m as { content: string }).content.length > MAX_CHARS_PER_MESSAGE
    ) {
      return null;
    }
    out.push({ role: (m as { role: "user" | "assistant" }).role, content: (m as { content: string }).content });
  }
  return out;
}

async function findOrCreateSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  persona: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("persona", persona)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: userId, persona })
    .select("id")
    .single();
  if (error) throw error;
  return created.id as string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ persona: string }> }
) {
  const { persona } = await params;
  const config = PERSONAS[persona as keyof typeof PERSONAS];
  if (!config) {
    return NextResponse.json({ error: `Unknown persona "${persona}".` }, { status: 400 });
  }

  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NVIDIA_NIM_API_KEY is not set on the server." }, { status: 500 });
  }

  // Auth + RLS-scoped client: chat rows are written as the logged-in user.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = auth.user.id;

  let messages: ChatMessage[] | null = null;
  try {
    const body = await req.json();
    messages = validateMessages(body?.messages);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!messages) {
    return NextResponse.json(
      { error: `Body must be {"messages":[{role:"user"|"assistant",content:string}]}, max ${MAX_MESSAGES} msgs / ${MAX_CHARS_PER_MESSAGE} chars.` },
      { status: 400 }
    );
  }

  let sessionId: string;
  try {
    sessionId = await findOrCreateSession(supabase, userId, persona);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        user_id: userId,
        role: "user",
        content: lastUser.content,
      });
    }
  } catch (err) {
    console.error("[chat] persistence failed:", err);
    return NextResponse.json({ error: "Could not save your message." }, { status: 500 });
  }

  let systemPrompt = config.systemPrompt;
  if (persona === "maya") {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const context = await retrieveContext(supabase, apiKey, lastUser?.content ?? "");
    // Only ground the reply when retrieval actually found something relevant.
    if (context) {
      systemPrompt += `\n\nREFERENCE CONTEXT from the app's peer-reviewed knowledge base. Ground your answer in it and cite it where relevant; if it doesn't cover the question, say so:\n\n${context}`;
    }
  }

  let nimRes: Response;
  try {
    nimRes = await fetch(NIM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-MAX_MESSAGES),
        ],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 2048,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the AI service." }, { status: 502 });
  }

  if (!nimRes.ok) {
    const detail = await nimRes.text().catch(() => "");
    console.error(`[chat] NIM ${nimRes.status}:`, detail.slice(0, 500));
    return NextResponse.json({ error: "The AI service returned an error." }, { status: 502 });
  }

  const completion = await nimRes.json().catch(() => null);
  const reply: string | undefined = completion?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return NextResponse.json({ error: "Empty reply from AI service." }, { status: 502 });
  }

  try {
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_id: userId,
      role: "assistant",
      content: reply,
    });
  } catch (err) {
    // Reply already generated; log and still return it rather than losing it.
    console.error("[chat] failed to persist assistant reply:", err);
  }

  return NextResponse.json({ reply });
}
