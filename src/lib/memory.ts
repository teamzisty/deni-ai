import { generateObject, type UIMessage } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { memoryItem, userMemory } from "@/db/schema";
import { env } from "@/env";
import { createDeniOpenRouter } from "@/lib/openrouter-provider";

export type PersonalizationProfile = {
  instructions: string;
  tone: "concise" | "balanced" | "detailed";
  friendliness: "neutral" | "friendly" | "very-friendly";
  warmth: "neutral" | "warm" | "very-warm";
  emojiStyle: "none" | "light" | "expressive";
  autoMemory: boolean;
};

const memoryExtractionSchema = z.object({
  /** False when nothing durable and new is worth saving. */
  hasNew: z.boolean(),
  memories: z
    .array(z.string().trim().min(1).max(240))
    .max(3)
    .describe(
      "Only brand-new durable facts not already covered by existing memories. Empty when hasNew is false.",
    ),
});

const defaultProfile: PersonalizationProfile = {
  instructions: "",
  tone: "balanced",
  friendliness: "friendly",
  warmth: "warm",
  emojiStyle: "light",
  autoMemory: true,
};

const openrouter = createDeniOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

export async function getUserMemoryState(userId: string) {
  const [profileRow, itemRows] = await Promise.all([
    db
      .select()
      .from(userMemory)
      .where(eq(userMemory.userId, userId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db.select().from(memoryItem).where(eq(memoryItem.userId, userId)).orderBy(memoryItem.updatedAt),
  ]);

  const profile: PersonalizationProfile = profileRow
    ? {
        instructions: profileRow.instructions,
        tone: normalizeTone(profileRow.tone),
        friendliness: normalizeFriendliness(profileRow.friendliness),
        warmth: normalizeWarmth(profileRow.warmth),
        emojiStyle: normalizeEmojiStyle(profileRow.emojiStyle),
        autoMemory: profileRow.autoMemory,
      }
    : defaultProfile;

  return {
    profile,
    items: itemRows,
  };
}

function normalizeTone(value: string): PersonalizationProfile["tone"] {
  if (value === "concise" || value === "detailed") {
    return value;
  }
  return "balanced";
}

function normalizeFriendliness(value: string): PersonalizationProfile["friendliness"] {
  if (value === "neutral" || value === "very-friendly") {
    return value;
  }
  return "friendly";
}

function normalizeWarmth(value: string): PersonalizationProfile["warmth"] {
  if (value === "neutral" || value === "very-warm") {
    return value;
  }
  return "warm";
}

function normalizeEmojiStyle(value: string): PersonalizationProfile["emojiStyle"] {
  if (value === "none" || value === "expressive") {
    return value;
  }
  return "light";
}

function describeProfile(profile: PersonalizationProfile) {
  return [
    `Tone: ${profile.tone}.`,
    `Friendliness: ${profile.friendliness}.`,
    `Warmth: ${profile.warmth}.`,
    `Emoji style: ${profile.emojiStyle}.`,
    profile.instructions ? `Custom instructions: ${profile.instructions}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildMemoryPrompt({
  profile,
  items,
}: {
  profile: PersonalizationProfile;
  items: Array<{ content: string }>;
}) {
  const memoryList =
    items.length > 0
      ? items.map((item, index) => `${index + 1}. ${item.content}`).join("\n")
      : "No saved memories.";

  return [
    "Personalization profile:",
    describeProfile(profile),
    "Saved memories:",
    memoryList,
    "Use these as background preferences when relevant. Do not mention them unless the user asks.",
  ].join("\n");
}

function getLatestUserText(messages: UIMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .slice(-6)
    .flatMap((message) => message.parts)
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeMemoryText(value: string) {
  return (
    value
      .normalize("NFKC")
      .toLowerCase()
      // Strip common list/label prefixes so "Name: rai" ≈ "ユーザーの名前は rai"
      .replace(
        /^(?:[-*•]\s*)?(?:name|user(?:'s)? name|preferred language|language|role|職|名前|言語)[:：\s]+/i,
        "",
      )
      .replace(/[`"'「」『』.,!?！？。、()（）{}[\]【】:;：；]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function tokenizeMemory(value: string) {
  const normalized = normalizeMemoryText(value);
  // Prefer space-split for Latin; fall back to CJK bigrams when unspaced.
  const spaceTokens = normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (spaceTokens.length >= 2 || !/[\u3040-\u30ff\u3400-\u9fff]/.test(normalized)) {
    return spaceTokens.filter((token) => token.length > 1 || /^[a-z0-9]+$/i.test(token));
  }

  const compact = normalized.replace(/\s+/g, "");
  if (compact.length <= 2) {
    return compact ? [compact] : [];
  }

  const bigrams: string[] = [];
  for (let i = 0; i < compact.length - 1; i += 1) {
    bigrams.push(compact.slice(i, i + 2));
  }
  return bigrams;
}

function getLabeledMemoryFingerprint(value: string) {
  const raw = value.normalize("NFKC").trim();
  const normalized = normalizeMemoryText(value);

  const nameMatch =
    raw.match(/^(?:user(?:'s)? name is|name|名前)[:：\s]+(.+)$/i) ??
    normalized.match(/^(?:name|名前)\s+(.+)$/);
  if (nameMatch) {
    return `name:${normalizeMemoryText(nameMatch[1])}`;
  }

  const languageMatch =
    raw.match(
      /^(?:user speaks|preferred language is|preferred language|language|speaks|言語|preferred language)[:：\s]+(.+)$/i,
    ) ?? normalized.match(/^(?:language|言語|speaks)\s+(.+)$/);
  if (languageMatch) {
    return `language:${normalizeMemoryText(languageMatch[1])}`;
  }

  const roleMatch =
    raw.match(/^(?:role|職|職業|役割)[:：\s]+(.+)$/i) ??
    normalized.match(/^(?:role|職|職業|役割)\s+(.+)$/);
  if (roleMatch) {
    return `role:${normalizeMemoryText(roleMatch[1])}`;
  }

  return null;
}

function labeledMemoryFingerprintsMatch(left: string, right: string) {
  // Content equality for dedupe labels — not a security comparison.
  if (left === right) {
    return true;
  }

  // Same fact slot (name/language/role) with near-equal values still collides.
  const [leftKey, ...leftRest] = left.split(":");
  const [rightKey, ...rightRest] = right.split(":");
  if (!leftKey || leftKey !== rightKey) {
    return false;
  }

  const leftVal = leftRest.join(":");
  const rightVal = rightRest.join(":");
  if (!leftVal || !rightVal) {
    return false;
  }

  if (leftVal === rightVal || leftVal.includes(rightVal) || rightVal.includes(leftVal)) {
    return true;
  }

  return jaccardSimilarity(tokenizeMemory(leftVal), tokenizeMemory(rightVal)) >= 0.5;
}

function jaccardSimilarity(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }
  const rightSet = new Set(right);
  let intersection = 0;
  const union = new Set(left);
  for (const token of left) {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  }
  for (const token of right) {
    union.add(token);
  }
  if (union.size === 0) {
    return 0;
  }
  return intersection / union.size;
}

function isNearDuplicateMemory(candidate: string, existing: string) {
  const candidateFingerprint = getLabeledMemoryFingerprint(candidate);
  const existingFingerprint = getLabeledMemoryFingerprint(existing);

  if (
    candidateFingerprint &&
    existingFingerprint &&
    labeledMemoryFingerprintsMatch(candidateFingerprint, existingFingerprint)
  ) {
    return true;
  }

  const candidateNormalized = normalizeMemoryText(candidate);
  const existingNormalized = normalizeMemoryText(existing);

  if (!candidateNormalized || !existingNormalized) {
    return false;
  }

  if (candidateNormalized === existingNormalized) {
    return true;
  }

  // Substring containment (handles rephrases that only add/remove filler).
  if (
    candidateNormalized.includes(existingNormalized) ||
    existingNormalized.includes(candidateNormalized)
  ) {
    const shorterLength = Math.min(candidateNormalized.length, existingNormalized.length);
    // CJK can be short but still meaningful (e.g. "日本語").
    if (shorterLength >= 2) {
      return true;
    }
  }

  const candidateTokens = tokenizeMemory(candidate);
  const existingTokens = tokenizeMemory(existing);

  if (candidateTokens.length === 1 && existingTokens.includes(candidateTokens[0])) {
    return true;
  }

  if (existingTokens.length === 1 && candidateTokens.includes(existingTokens[0])) {
    return true;
  }

  // Overlapping multi-token facts (e.g. "prefers concise answers" vs "likes short replies").
  if (jaccardSimilarity(candidateTokens, existingTokens) >= 0.55) {
    return true;
  }

  return false;
}

function dedupeMemories(memories: string[]) {
  return memories.filter((memory, index) => {
    return !memories.slice(0, index).some((existing) => isNearDuplicateMemory(memory, existing));
  });
}

function formatExistingMemoriesForAgent(existingMemories: string[]) {
  if (existingMemories.length === 0) {
    return "None yet.";
  }

  // Newest-ish order is not critical for the agent; keep stable list order from DB.
  // Cap extremely large lists so the extraction prompt stays focused.
  const MAX_SHOWN = 80;
  const shown = existingMemories.slice(-MAX_SHOWN);
  const omitted = existingMemories.length - shown.length;
  const lines = shown.map((item, index) => `${index + 1}. ${item}`);
  if (omitted > 0) {
    lines.unshift(`(${omitted} older memories omitted)`);
  }
  return lines.join("\n");
}

const MEMORY_EXTRACTION_SYSTEM = `You are Deni AI's memory curator.

You will be given:
1) The user's EXISTING saved memories (already stored — treat them as ground truth).
2) Recent user messages from the current chat.

Your job is ONLY to decide whether those recent messages add durable facts that are NOT already covered by existing memories.

Rules:
- Read existing memories FIRST. If a fact is already present (even with different wording, language, or label style), do NOT save it again.
- Prefer hasNew=false and memories=[] in almost all cases. Silence is correct when nothing is new.
- Save at most 3 brand-new durable items. Prefer 0–1.
- Durable = stable preferences, identity, constraints, tools, or long-lived context (name, language, role, coding stack, always-on preferences).
- NOT durable = one-off tasks, transient questions, secrets/credentials, temporary debugging, greetings, or anything already implied by existing memories.
- Use short canonical labels so future dedupe is easy, e.g. "Name: rai", "Preferred language: Japanese", "Role: Deni AI owner".
- Do not restate, rephrase, translate, or "improve" existing memories.
- Do not invent facts the user did not clearly state.`;

export async function maybeAutoSaveMemories({
  userId,
  messages,
  enabled,
}: {
  userId: string;
  messages: UIMessage[];
  enabled: boolean;
}) {
  if (!enabled) {
    return;
  }

  const transcript = getLatestUserText(messages);
  if (!transcript) {
    return;
  }

  // Skip trivial turns that almost never produce durable memory.
  if (transcript.replace(/\s+/g, "").length < 8) {
    return;
  }

  const existingItems = await db.select().from(memoryItem).where(eq(memoryItem.userId, userId));
  const existingMemories = existingItems.map((item) => item.content.trim()).filter(Boolean);
  const existingBlock = formatExistingMemoriesForAgent(existingMemories);

  const { object } = await generateObject({
    model: openrouter.chat("google/gemini-3-flash-preview"),
    schema: memoryExtractionSchema,
    system: MEMORY_EXTRACTION_SYSTEM,
    // Existing memories first so the model grounds against them before reading the chat.
    prompt: [
      "## Existing memories (already saved — do not duplicate)",
      existingBlock,
      "",
      "## Recent user messages",
      transcript,
      "",
      "Return hasNew=false and memories=[] unless the recent messages clearly introduce durable facts missing above.",
    ].join("\n"),
  });

  if (!object.hasNew) {
    return;
  }

  const freshMemories = dedupeMemories(
    object.memories
      .map((memory) => memory.trim())
      .filter(Boolean)
      .filter(
        (memory) => !existingMemories.some((existing) => isNearDuplicateMemory(memory, existing)),
      ),
  );

  if (freshMemories.length === 0) {
    return;
  }

  await db.insert(memoryItem).values(
    freshMemories.map((memory) => ({
      id: crypto.randomUUID(),
      userId,
      content: memory,
      source: "auto",
    })),
  );
}
