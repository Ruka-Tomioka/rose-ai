import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

import { SendGraceChatBody, SendGraceChatResponse } from "../_lib/schemas";
import { ROSE_SYSTEM_PROMPT } from "../_lib/prompt";
import { hasCrisisSignal } from "../_lib/crisis";
import {
  GRACE_SCOPE_BYPASS_PATTERNS,
  GRACE_SCOPE_DECLINES,
  GRACE_SCOPE_RULES,
} from "../_lib/grace-scope";
import {
  countryFromIp,
  resourcesForCountry,
} from "../_lib/support-resources";

const CHAT_ERROR =
  "I can't reach my words right now - please try again in a moment.";
const RATE_LIMIT_ERROR =
  "Rose's daily limit has been reached for now. Please come back later.";
const KINDNESS_NOTE =
  "Taking a moment to respond with care is already a kindness.";

function clientIp(req: VercelRequest): string | undefined {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0].split(",")[0].trim();
  return undefined;
}

function isClearlyOutOfScope(message: string): boolean {
  if (GRACE_SCOPE_BYPASS_PATTERNS.some((pattern) => pattern.test(message))) {
    return false;
  }
  return GRACE_SCOPE_RULES.some((rule) =>
    rule.patterns.some((pattern) => pattern.test(message)),
  );
}

function chooseScopeDecline(): string {
  return GRACE_SCOPE_DECLINES[
    Math.floor(Math.random() * GRACE_SCOPE_DECLINES.length)
  ];
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as {
    status?: unknown;
    response?: { status?: unknown };
  };
  if (typeof candidate.status === "number") return candidate.status;
  if (typeof candidate.response?.status === "number") {
    return candidate.response.status;
  }
  return undefined;
}

// Strips every markdown marker the model might reach for, so replies always
// arrive as plain sentences.
function stripFormatting(text: string): string {
  return text
    .replace(/\*+/g, "")
    .replace(/`+/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-•]\s+/gm, "");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const parsed = SendGraceChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const message = parsed.data.message.trim();
  if (!message) {
    res.status(400).json({ error: "Please share a little more to begin." });
    return;
  }

  let crisisSupport = hasCrisisSignal(message);

  // An off-topic lookup is turned away without spending a model call.
  // Crisis always wins over the scope check.
  if (!crisisSupport && isClearlyOutOfScope(message)) {
    res.json(
      SendGraceChatResponse.parse({
        reply: chooseScopeDecline(),
        kindnessNote: KINDNESS_NOTE,
        crisisSupport: false,
        supportResources: [],
      }),
    );
    return;
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    console.error("GROQ_API_KEY is not configured");
    res.status(500).json({ error: CHAT_ERROR });
    return;
  }

  const history = (parsed.data.history ?? []).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  try {
    const groq = new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
    });

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      max_tokens: 700,
      messages: [
        { role: "system", content: ROSE_SYSTEM_PROMPT },
        ...history,
        { role: "user", content: message },
      ],
    });

    let reply = completion.choices[0]?.message?.content?.trim();
    reply = reply ? stripFormatting(reply) : reply;

    // Rose flags risk herself with a hidden marker; it never reaches the screen.
    if (reply && /\[\[\s*CRISIS\s*\]\]/i.test(reply)) {
      crisisSupport = true;
    }
    if (reply) {
      reply = reply.replace(/\[\[[^\]]*\]\]/g, "").trim();
    }

    if (!reply) {
      console.error("Groq returned an empty response");
      res.status(500).json({ error: CHAT_ERROR });
      return;
    }

    res.json(
      SendGraceChatResponse.parse({
        reply,
        kindnessNote: KINDNESS_NOTE,
        crisisSupport,
        supportResources: crisisSupport
          ? resourcesForCountry(await countryFromIp(clientIp(req)))
          : [],
      }),
    );
  } catch (error) {
    if (getHttpStatus(error) === 429) {
      console.warn("Groq rate limit reached");
      res.status(429).json({ error: RATE_LIMIT_ERROR });
      return;
    }
    console.error("Groq chat completion failed", error);
    res.status(500).json({ error: CHAT_ERROR });
  }
}
