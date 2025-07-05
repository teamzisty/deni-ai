export const BRAND_NAME = "Deni AI"; // Change your brand

export const GITHUB_URL = "https://github.com/raicdev/deni-ai" // Change to your GitHub URL

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
  "- **Canvas**: Create and manipulate images.",
].join("\n");

export const ERROR_MAPPING: Record<string, string> = {
  "common.invalid_request": "Oops, something went wrong with your request.",
  "common.internal_error": "Oops, we are experiencing an issue.",
  "chat.model_limit_reached": "You've reached your usage limit for this model.",
};

export const PREMIUM_USES_LIMIT = 30; // Default is 30 per day

export type ModelFeature =
  | "vision"
  | "fast"
  | "reasoning"
  | "tools"
  | "experimental";
export type ModelProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "groq"
  | "openrouter";
export type ModelAuthor =
  | "OpenAI"
  | "Anthropic"
  | "Google"
  | "xAI"
  | "DeepSeek";
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
}

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

export const models: Record<string, Model> = {
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Fast, intelligent, flexible GPT model.",
    author: "OpenAI",
    provider: "openai",
    context_window: 128000,
    features: ["vision", "tools"],
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    description: "Fast, affordable small model for focused tasks.",
    author: "OpenAI",
    provider: "openai",
    context_window: 128000,
    features: ["vision", "tools", "fast"],
  },
  "gpt-4.1": {
    id: "gpt-4.1",
    name: "GPT-4.1",
    description: "Flagship GPT model for complex tasks.",
    author: "OpenAI",
    provider: "openai",
    context_window: 1047576,
    features: ["vision", "tools"],
  },
  "gpt-4.1-mini": {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 mini",
    description: "Balanced for intelligence, speed, and cost.",
    author: "OpenAI",
    provider: "openai",
    context_window: 1047576,
    features: ["vision", "fast", "tools"],
  },
  "gpt-4.1-nano": {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 nano",
    description: "Fastest, most cost-effective GPT-4.1 model.",
    author: "OpenAI",
    provider: "openai",
    context_window: 1047576,
    features: ["vision", "fast", "tools"],
  },
  "o4-mini": {
    id: "o4-mini",
    name: "o4-mini",
    description: "Faster, more affordable reasoning model from OpenAI.",
    author: "OpenAI",
    provider: "openai",
    reasoning_efforts: ["low", "medium", "high"],
    context_window: 200000,
    features: ["vision", "reasoning", "tools"],
  },
  o3: {
    id: "o3",
    name: "o3",
    description: "OpenAI's most powerful reasoning model.",
    author: "OpenAI",
    provider: "openai",
    reasoning_efforts: ["low", "medium", "high"],
    context_window: 200000,
    features: ["vision", "reasoning", "tools"],
  },
  "o3-pro": {
    id: "o3-pro",
    name: "o3-pro",
    description: "Version of o3 with more compute for better responses.",
    author: "OpenAI",
    provider: "openai",
    premium: true,
    context_window: 200000,
    features: ["vision", "reasoning", "tools"],
  },
  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Google's most advanced reasoning Gemini model.",
    author: "Google",
    provider: "google",
    reasoning_efforts: ["low", "medium", "high"],
    context_window: 1048576,
    features: ["vision", "reasoning", "tools"],
  },
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Google's best model in terms of price and performance.",
    author: "Google",
    provider: "google",
    reasoning_efforts: ["disabled", "low", "medium", "high"],
    context_window: 1048576,
    features: ["vision", "reasoning", "fast", "tools"],
  },
  "gemini-2.5-flash-lite": {
    id: "gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash Lite",
    description: "Google's best model in terms of price and performance.",
    author: "Google",
    provider: "google",
    reasoning_efforts: ["disabled", "low", "medium", "high"],
    context_window: 1048576,
    features: ["vision", "reasoning", "fast", "tools", "experimental"],
  },
  "claude-sonnet-4": {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description: "Anthropic's hybrid reasoning model.",
    author: "Anthropic",
    provider: "anthropic",
    reasoning_efforts: ["disabled", "low", "medium", "high"],
    context_window: 200000,
    features: ["vision", "reasoning", "tools"],
  },
  "claude-opus-4": {
    id: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    description: "Anthropic's advanced reasoning model.",
    author: "Anthropic",
    provider: "anthropic",
    premium: true,
    reasoning_efforts: ["disabled", "low", "medium", "high"],
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
  "deepseek-r1": {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    description: "DeepSeek's advanced reasoning model.",
    author: "DeepSeek",
    provider: "groq",
    context_window: 1048576,
    features: ["vision", "reasoning", "tools"],
  },
};

export const internalModels: Record<string, Model> = {
  "title-model": models["gemini-2.5-flash-lite"]!,
  "search-summary-model": models["gemini-2.5-flash-lite"]!,
  "research-summary-model": models["gemini-2.5-flash"]!,
};
