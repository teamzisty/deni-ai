import "server-only";

import { generateObject, type UIMessage } from "ai";
import { and, eq } from "drizzle-orm";
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
  memories: z.array(z.string().trim().min(1).max(240)).max(3),
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
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[`"'.,!?(){}[\]:;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeMemory(value: string) {
  return normalizeMemoryText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function getLabeledMemorySignature(value: string) {
  const normalized = normalizeMemoryText(value);

  const nameMatch = normalized.match(/^(?:user s name is|name)\s+(.+)$/);
  if (nameMatch) {
    return `name:${nameMatch[1].trim()}`;
  }

  const languageMatch = normalized.match(
    /^(?:user speaks|preferred language is|preferred language|language|speaks)\s+(.+)$/,
  );
  if (languageMatch) {
    return `language:${languageMatch[1].trim()}`;
  }

  return null;
}

function isNearDuplicateMemory(candidate: string, existing: string) {
  const candidateSignature = getLabeledMemorySignature(candidate);
  const existingSignature = getLabeledMemorySignature(existing);

  if (candidateSignature && existingSignature && candidateSignature === existingSignature) {
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

  if (
    candidateNormalized.includes(existingNormalized) ||
    existingNormalized.includes(candidateNormalized)
  ) {
    const shorterLength = Math.min(candidateNormalized.length, existingNormalized.length);
    if (shorterLength >= 4) {
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

  return false;
}

function dedupeMemories(memories: string[]) {
  return memories.filter((memory, index) => {
    return !memories.slice(0, index).some((existing) => isNearDuplicateMemory(memory, existing));
  });
}

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

  const existingItems = await db.select().from(memoryItem).where(eq(memoryItem.userId, userId));
  const existingMemories = existingItems.map((item) => item.content.trim()).filter(Boolean);

  const { object } = await generateObject({
    model: openrouter.chat("google/gemini-3-flash-preview"),
    schema: memoryExtractionSchema,
    system:
      "Extract only durable user preferences or facts worth remembering for future chats. Ignore transient requests, one-off tasks, secrets, and credentials. Return at most 3 concise memory strings. Use canonical wording so duplicates collapse cleanly, for example `Name: rai`, `Preferred language: Japanese`, `Role: Deni AI owner`. Do not restate the same fact in multiple ways.",
    prompt: `Existing memories:\n${existingMemories.map((item) => `- ${item}`).join("\n") || "None"}\n\nRecent user messages:\n${transcript}`,
  });

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

export async function deleteMemoryItemForUser(userId: string, id: string) {
  const [deleted] = await db
    .delete(memoryItem)
    .where(and(eq(memoryItem.userId, userId), eq(memoryItem.id, id)))
    .returning();

  return deleted ?? null;
}
