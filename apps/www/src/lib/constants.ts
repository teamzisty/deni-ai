import { Bot } from "./bot";

export const BRAND_NAME = "Deni AI"; // Change your brand

export const VERSION = {
  version: "5.2.2",
  codename: "Iris",
}; // Version

export const GITHUB_URL = "https://github.com/raicdev/deni-ai"; // Change to your GitHub URL

export const loading_words = [
  "Making things happen...",
  "Loading the magic...",
  "Working on it...",
  "Crafting your experience...",
  "Just a moment...",
  "Almost there...",
  "Creating something special...",
  "Putting the pieces together...",
  "Hang tight...",
  "Building your request...",
  "Cooking up something great...",
  "Preparing your content...",
  "Getting everything ready...",
  "Finalizing the details...",
  "Polishing the experience...",
  "Filling the missing pieces...",
];

export const SYSTEM_PROMPT = [
  `You are a helpful AI assistant on ${BRAND_NAME}. Your task is to assist users with their questions and provide accurate information based on the context provided.`,
  "",
  "# Tools",
  "You have access to the following tools:",
  "- **Search**: Search the web for information.",
  "> `query` is the search query to execute",
  "> `language` is the language to use for the search (ex. 'en', 'fr', 'es', 'all')",
  "> `country` is the country to use for the search (ex. 'us', 'uk', 'fr', 'all')",
  "> `depth` is the depth of the search (ex. 'disabled', 'shallow', 'deep', 'deeper') (Research mode)",
  "- **Canvas**: Create and manipulate images.",
  "> `title` is the title of Canvas.",
  "> `content` is the content of Canvas.",
  "# Research",
  "Use the search tool to find information on the web deep and wide.",
  "disabled: search once or twice",
  "shallow: search 3 results",
  "deep: search 4 results",
  "deeper: search 5 results",
].join("\n");

export const getSystemPrompt = (researchMode: "disabled" | "shallow" | "deep" | "deeper", features: { search: boolean, canvas: boolean }, bot?: Bot | null) => {
  let systemPrompt = SYSTEM_PROMPT;
  systemPrompt += "\n\n" + "Research mode is: " + researchMode;
  systemPrompt += "\n\n" + "Please use the following features: " + JSON.stringify(features);
  if (bot) {
    systemPrompt += [
      "\n\n",
      "# Bot",
      "Bot is a user-created agent. It is designed to assist with tasks and answer questions. Bot name is: " + bot.name,
      bot.systemInstruction,
    ].join("\n");
  }
  return systemPrompt;
};

export const ERROR_MAPPING: Record<string, string> = {
  "common.invalid_request": "Oops, something went wrong with your request.",
  "common.internal_error": "Oops, we are experiencing an issue.",
  "chat.model_limit_reached": "You've reached your usage limit for this model.",
};

export const languages = {
  en: {
    id: "en",
    name: "English",
  },
  ja: {
    id: "ja",
    name: "日本語",
  },
};

export const PREMIUM_USES_LIMIT = -1; // Default is 30 per day

export type ModelFeature =
  | "vision"
  | "fast"
  | "reasoning"
  | "tools"
  | "experimental";
// export type ModelProvider =
//   | "openai"
//   | "anthropic"
//   | "google"
//   | "xai"
//   | "groq"
//   | "openrouter";
export type ModelAuthor =
  | "OpenAI"
  | "Anthropic"
  | "Google"
  | "xAI"
  | "DeepSeek"
  | "Kimi";
export type ModelProvider = "openai" | "anthropic" | "google" | "xai" | "voids";
export type ReasoningEffort = "disabled" | "low" | "medium" | "high";

export interface Model {
  id: string;
  name: string;
  description: string;
  author: ModelAuthor;
  provider: ModelProvider;
  reasoning_efforts?: ReasoningEffort[];
  premium?: boolean;
  context_window?: number;
  features?: ModelFeature[];
  legacy?: boolean;
}

export const models: Record<string, Model> = {
  "gpt-4o": {
    id: "gpt-4o-2024-11-20",
    name: "GPT-4o",
    description: "Fast, intelligent, flexible GPT model.",
    author: "OpenAI",
    provider: "openai",
    context_window: 128000,
    features: ["vision", "tools"],
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini-2024-07-18",
    name: "GPT-4o mini",
    description: "Fast, affordable small model for focused tasks.",
    author: "OpenAI",
    provider: "openai",
    context_window: 128000,
    features: ["vision", "tools", "fast"],
  },
  "gpt-4.1": {
    id: "gpt-4.1-2025-04-14",
    name: "GPT-4.1",
    description: "Flagship GPT model for complex tasks.",
    author: "OpenAI",
    provider: "openai",
    context_window: 1047576,
    features: ["vision", "tools"],
  },
  "gpt-4.1-mini": {
    id: "gpt-4.1-mini-2025-04-14",
    name: "GPT-4.1 mini",
    description: "Balanced for intelligence, speed, and cost.",
    author: "OpenAI",
    provider: "openai",
    context_window: 1047576,
    features: ["vision", "fast", "tools"],
  },
  "gpt-4.1-nano": {
    id: "gpt-4.1-nano-2025-04-14",
    name: "GPT-4.1 nano",
    description: "Fastest, most cost-effective GPT-4.1 model.",
    author: "OpenAI",
    provider: "openai",
    context_window: 1047576,
    features: ["vision", "fast", "tools"],
  },
  "o4-mini": {
    id: "o4-mini-2025-04-16",
    name: "o4-mini",
    description: "Faster, more affordable reasoning model from OpenAI.",
    author: "OpenAI",
    reasoning_efforts: ["low", "medium", "high"],
    provider: "openai",
    context_window: 200000,
    features: ["vision", "reasoning", "tools"],
  },
  o3: {
    id: "o3-2025-04-16",
    name: "o3",
    description: "OpenAI's most powerful reasoning model.",
    author: "OpenAI",
    reasoning_efforts: ["low", "medium", "high"],
    provider: "openai",
    context_window: 200000,
    features: ["vision", "reasoning", "tools"],
  },
  "o3-pro": {
    id: "o3-pro",
    name: "o3-pro",
    description: "Version of o3 with more compute for better responses.",
    author: "OpenAI",
    premium: true,
    provider: "openai",
    context_window: 200000,
    features: ["vision", "reasoning", "tools"],
  },
  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Google's most advanced reasoning Gemini model.",
    author: "Google",
    reasoning_efforts: ["low", "medium", "high"],
    provider: "google",
    context_window: 1048576,
    features: ["vision", "reasoning", "tools"],
  },
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Google's best model in terms of price and performance.",
    author: "Google",
    reasoning_efforts: ["disabled", "low", "medium", "high"],
    provider: "google",
    context_window: 1048576,
    features: ["vision", "reasoning", "fast", "tools"],
  },
  "gemini-2.5-flash-lite": {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    description: "Google's best model in terms of price and performance.",
    author: "Google",
    reasoning_efforts: ["disabled", "low", "medium", "high"],
    provider: "google",
    context_window: 1048576,
    features: ["vision", "reasoning", "fast", "tools", "experimental"],
  },
  "claude-sonnet-4": {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description: "Anthropic's hybrid reasoning model.",
    author: "Anthropic",
    reasoning_efforts: ["disabled", "low", "medium", "high"],
    provider: "voids",
    context_window: 200000,
    features: ["vision", "reasoning", "tools"],
  },
  "claude-opus-4": {
    id: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    description: "Anthropic's advanced reasoning model.",
    author: "Anthropic",
    reasoning_efforts: ["disabled", "low", "medium", "high"],
    provider: "anthropic",
    premium: true,
    context_window: 200000,
    features: ["vision", "reasoning", "tools"],
  },
  "claude-3.5-haiku": {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    description: "Anthropic's fastest model.",
    author: "Anthropic",
    provider: "anthropic",
    context_window: 200000,
    features: ["vision", "fast", "tools"],
  },
  "grok-4": {
    id: "grok-4-0709",
    name: "Grok 4",
    description: "Grok's advanced reasoning model.",
    author: "xAI",
    provider: "xai",
  },
  "deepseek-r1": {
    id: "deepseek-r1-0528",
    name: "DeepSeek R1",
    description: "DeepSeek's advanced reasoning model.",
    author: "DeepSeek",
    provider: "voids",
    context_window: 128000,
    features: ["vision", "reasoning", "tools"],
  },
  "deepseek-v3": {
    id: "deepseek-v3-0324",
    name: "DeepSeek V3",
    description: "DeepSeek's fast chat model.",
    author: "DeepSeek",
    provider: "voids",
    context_window: 128000,
    features: ["vision", "tools"],
  },
  "kimi-k2": {
    id: "kimi-k2-instruct",
    name: "Kimi K2",
    description: "Kimi's fast reasoning model.",
    author: "Kimi",
    provider: "voids",
    context_window: 128000,
    features: ["vision", "tools"],
  },
  // Legacy models
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Gemini 2.0 Flash",
    features: ["vision", "fast", "tools"],
    author: "Google",
    provider: "google",
    legacy: true,
  },
  "gemini-2.0-flash-lite": {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    description: "Gemini 2.0 Flash Lite",
    author: "Google",
    features: ["vision", "fast", "tools"],
    provider: "google",
    legacy: true,
  },
  "grok-3": {
    id: "grok-3",
    name: "Grok 3",
    description: "Grok 3",
    author: "xAI",
    provider: "xai",
    legacy: true,
  },
  "grok-3-mini": {
    id: "grok-3-mini-high",
    name: "Grok 3 Mini",
    description: "Grok 3 Mini High",
    author: "xAI",
    provider: "xai",
    legacy: true,
  },
  "claude-3-7-sonnet": {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    description: "Claude 3.7 Sonnet",
    features: ["vision", "reasoning", "tools"],
    reasoning_efforts: ["disabled", "low", "medium", "high"],
    author: "Anthropic",
    provider: "anthropic",
    legacy: true,
  },
};

export const internalModels: Record<string, Model> = {
  "title-model": models["gemini-2.5-flash-lite"]!,
  "search-summary-model": models["gemini-2.5-flash-lite"]!,
  "research-summary-model": models["gemini-2.5-flash"]!,
};
