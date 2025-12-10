import { createOpenAI } from "@ai-sdk/openai";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { providerKey } from "@/db/schema";
import { env } from "@/env";
import { decryptFromB64 } from "@/lib/crypto";

// If needed later, add: import { anthropic } from '@ai-sdk/anthropic'; etc.
// To avoid heavy deps explosion, we keep OpenAI default and allow OpenRouter via env/BYOK through OpenAI-compatible endpoint.

export type Provider =
  | "openai"
  | "openrouter"
  | "anthropic"
  | "google"
  | "tavily";

export type ModelInput = {
  provider: Provider;
  model: string; // e.g., 'gpt-4o-mini', 'openrouter/anthropic/claude-3.5-sonnet'
};

export type resolveApiKeyProps = {
  preferred: "BYOK" | "env";
  key: string | null;
};
export async function resolveApiKey(
  userId: string,
  provider: Provider,
): Promise<resolveApiKeyProps> {
  // Prefer user BYOK; fallback to server env
  const rows = await db
    .select()
    .from(providerKey)
    .where(
      and(eq(providerKey.userId, userId), eq(providerKey.provider, provider)),
    )
    .limit(1);
  if (rows.length && rows[0].keyEnc)
    return {
      preferred: "BYOK",
      key: await decryptFromB64(rows[0].keyEnc),
    };

  let key: string | null = null;
  switch (provider) {
    case "openai":
      key = env.OPENAI_API_KEY ?? null;
      break;
    case "openrouter":
      key = env.OPENROUTER_API_KEY ?? null;
      break;
    case "anthropic":
      key = env.ANTHROPIC_API_KEY ?? null;
      break;
    case "google":
      key = env.GOOGLE_GENERATIVE_AI_API_KEY ?? null;
      break;
    case "tavily":
      key = env.TAVILY_API_KEY ?? null;
      break;
    default:
      key = null;
      break;
  }

  return {
    preferred: "env",
    key,
  };
}

export async function buildModel(userId: string, input?: Partial<ModelInput>) {
  const provider =
    input?.provider ??
    (env.OPENAI_API_KEY
      ? "openai"
      : env.OPENROUTER_API_KEY
        ? "openrouter"
        : "openai");
  const { key } = await resolveApiKey(userId, provider);

  if (!key) {
    throw new Error(
      "No available API key found. Add one in Settings → API Keys to continue.",
    );
  }

  if (provider === "openrouter") {
    const baseURL = "https://openrouter.ai/api/v1";
    const openrouter = createOpenAI({ apiKey: key, baseURL });
    const modelName =
      input?.model ?? "openrouter/anthropic/claude-3.5-sonnet:beta";
    return { model: openrouter(modelName) } as const;
  }

  if (provider !== "openai") {
    throw new Error(`Provider "${provider}" is not yet supported.`);
  }

  const oai = createOpenAI({
    apiKey: key,
  });
  const modelName = input?.model ?? "gpt-4o-mini";
  return { model: oai(modelName) } as const;
}
