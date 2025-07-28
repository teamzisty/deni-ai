import z from "zod/v4";
import { db, bots } from "./db";
import { eq } from "drizzle-orm";

export interface Bot {
  id: string;
  userId: string;
  name: string;
  description: string;
  systemInstruction: string;
  instructions: { content: string }[];
  // visibility: "public" | "unlisted" | "private";
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientBot {
  id: string;
  name: string;
  description: string;
  instructions: { content: string }[];
  created_by: {
    name: string;
    verified: boolean;
    id: string;
  };
  created_at: number;
}

export const BotSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  systemInstruction: z.string(),
  instructions: z.array(z.object({ content: z.string() })),
  visibility: z.enum(["public", "unlisted", "private"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getBot = async (id: string): Promise<Bot | null> => {
  try {
    const [bot] = await db
      .select()
      .from(bots)
      .where(eq(bots.id, id))
      .limit(1);

    if (!bot) {
      return null;
    }

    return {
      id: bot.id,
      userId: bot.userId,
      name: bot.name,
      description: bot.description || "",
      systemInstruction: bot.systemInstruction || "",
      instructions: (bot.instructions as { content: string }[]) || [],
      createdAt: bot.createdAt!,
      updatedAt: bot.updatedAt!,
    };
  } catch (error) {
    console.error("Error fetching bot:", error);
    return null;
  }
};
