import z from "zod/v4";

export interface Bot {
  id: string;
  user_id: string;
  name: string;
  description: string;
  system_instruction: string;
  instructions: { content: string }[];
  // visibility: "public" | "unlisted" | "private";
  created_at: string;
  updated_at: string;
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
  user_id: z.string(),
  name: z.string(),
  description: z.string(),
  system_instruction: z.string(),
  instructions: z.array(z.object({ content: z.string() })),
  visibility: z.enum(["public", "unlisted", "private"]),
  created_at: z.string(),
  updated_at: z.string(),
});