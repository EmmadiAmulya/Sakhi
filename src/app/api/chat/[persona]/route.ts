import { NextRequest, NextResponse } from "next/server";
import { PERSONAS } from "@/lib/personas";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Reasoning models stream for a while; give the function room (Vercel-capped).
export const maxDuration = 300;

// ponytail: per-persona model, global env override, one fallback for NIM 503s.
const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL_OVERRIDE = process.env.NVIDIA_NIM_MODEL;
const FALLBACK_MODEL = process.env.NVIDIA_NIM_FALLBACK_MODEL ?? "nvidia/nemotron-3-super-120b-a12b";
const MAX_MESSAGES = 40;
const MAX_CHARS_PER_MESSAGE = 8000;
const MAX_THINKING_CHARS = 32000;
const MAX_TOKENS = 32768;
// NIM reasoning models accept only low|high|max — "medium" is rejected (422).
const VALID_EFFORTS = new Set(["low", "high", "max"]);
const ENV_EFFORT = process.env.NVIDIA_NIM_REASONING_EFFORT;
// Abort the upstream stream if it goes silent this long.
const NIM_INACTIVITY_MS = 45_000;
const EMBED_TIMEOUT_MS = 8_000;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  reasoning_content?: string; // preserved thinking for multi-turn K3 conversations
};

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
      signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
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
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string" ||
      !content.trim() ||
      content.length > MAX_CHARS_PER_MESSAGE
    ) {
      return null;
    }
    const reasoning = (m as { reasoning_content?: unknown }).reasoning_content;
    out.push({
      role,
      content,
      ...(typeof reasoning === "string" && reasoning.trim()
        ? { reasoning_content: reasoning.slice(0, MAX_THINKING_CHARS) }
        : {}),
    });
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

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  let sessionId: string;
  try {
    sessionId = await findOrCreateSession(supabase, userId, persona);
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
  const EMERGENCY_REGEX =
    /\b(suicid|kill\s+(myself|me)|end\s+my\s+life|hurt\s+myself|self[- ]harm|overdose|want\s+to\s+die|severe\s+bleeding|chest\s+pain|cannot\s+breathe|can'?t\s+breathe|unconscious|poisoning|emergency\s+helpline|crisis\s+line)\b/i;
  const isEmergency = EMERGENCY_REGEX.test(lastUser?.content ?? "");

  if (persona === "maya") {
    const context = await retrieveContext(supabase, apiKey, lastUser?.content ?? "");
    // Only ground the reply when retrieval actually found something relevant.
    if (context) {
      systemPrompt += `\n\nREFERENCE CONTEXT from the app's peer-reviewed knowledge base. Ground your answer in it and cite it where relevant; if it doesn't cover the question, say so:\n\n${context}`;
    }
  }

  const reasoningEffort =
    ENV_EFFORT && VALID_EFFORTS.has(ENV_EFFORT) ? ENV_EFFORT : config.reasoningEffort;
  const primaryModel = MODEL_OVERRIDE ?? config.chatModel;

  // Abort handle for the inactivity watchdog (shared with the stream reader).
  const nimAbort = new AbortController();

  const payload = {
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: MAX_TOKENS,
    temperature: 1,
    seed: 0,
    reasoning_effort: reasoningEffort,
    stream: true,
  };

  const callNim = (model: string) =>
    fetch(NIM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ ...payload, model }),
      signal: nimAbort.signal,
    });

  // NIM instances occasionally 503 under load; retry once on the fallback model.
  const tryModel = async (model: string): Promise<{ res: Response | null; detail: string }> => {
    try {
      const res = await callNim(model);
      if (res.ok) return { res, detail: "" };
      const detail = await res.text().catch(() => "");
      console.error(`[chat] NIM ${res.status} on ${model}:`, detail.slice(0, 300));
      return { res: null, detail };
    } catch (err) {
      console.error(`[chat] NIM request failed on ${model}:`, err);
      return { res: null, detail: "" };
    }
  };

  let { res: nimRes, detail: failureDetail } = await tryModel(primaryModel);
  if (!nimRes && primaryModel !== FALLBACK_MODEL) {
    ({ res: nimRes, detail: failureDetail } = await tryModel(FALLBACK_MODEL));
  }

  if (!nimRes || !nimRes.body) {
    const detail = failureDetail ? ` ${failureDetail.slice(0, 300)}` : "";
    return NextResponse.json(
      { error: `The AI service returned an error.${detail}`.trim() },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let accumulatedReply = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      // 1. Emit metadata event (including emergency status)
      send("meta", { isEmergency });

      const reader = nimRes.body!.getReader();
      let buffer = "";
      let sawOutput = false;

      let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
      const armWatchdog = () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => nimAbort.abort(), NIM_INACTIVITY_MS);
      };

      const handleLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) return;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === "[DONE]") return;
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed?.choices?.[0]?.delta as
            | { content?: string | null; reasoning_content?: string | null }
            | undefined;
          const thinking = delta?.reasoning_content;
          if (thinking) {
            sawOutput = true;
            send("thinking", { thinking });
          }
          const text = delta?.content;
          if (text) {
            sawOutput = true;
            accumulatedReply += text;
            send("delta", { text });
          }
        } catch {
          // Ignore partial JSON chunks
        }
      };

      try {
        armWatchdog();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          armWatchdog();

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) handleLine(line);
        }
        if (buffer) handleLine(buffer);

        if (!sawOutput) send("error", { error: "The AI service returned no output." });
        send("done", {});
      } catch (streamErr) {
        console.error("[chat] streaming error:", streamErr);
        send("error", {
          error: nimAbort.signal.aborted
            ? "The AI service stopped responding. Please try again."
            : "The AI reply was interrupted. Please try again.",
        });
      } finally {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        controller.close();
        const finalReply = accumulatedReply.trim();
        if (finalReply) {
          try {
            await supabase.from("chat_messages").insert({
              session_id: sessionId,
              user_id: userId,
              role: "assistant",
              content: finalReply,
            });
          } catch (persistErr) {
            console.error("[chat] failed to persist assistant reply:", persistErr);
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
