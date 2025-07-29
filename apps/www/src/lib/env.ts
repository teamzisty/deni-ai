import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    // OPENAI_API_KEY: z.string(),
    // ANTHROPIC_API_KEY: z.string(),
    // GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
    // OPENROUTER_API_KEY: z.string(),
    // XAI_API_KEY: z.string(),
    // GROQ_API_KEY: z.string(),
    BRAVE_SEARCH_API_KEY: z.string(),
    UPLOADTHING_TOKEN: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    // OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    // ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    // GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    // OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    // XAI_API_KEY: process.env.XAI_API_KEY,
    // GROQ_API_KEY: process.env.GROQ_API_KEY,
    BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  },
});
