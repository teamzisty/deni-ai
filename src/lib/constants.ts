export type Author = "openai" | "anthropic" | "google" | "xAI";

export enum AuthorEnum {
  openai = "OpenAI",
  anthropic = "Anthropic",
  google = "Google",
  xai = "xAI",
}

export type Models = {
  [key: string]: {
    author: Author;
    model: string;
    label: string;
    description: string;
  };
};

export const featureMap = {
  reasoning: "Reasoning",
  smart: "Smart",
  fast: "Fast",
  coding: "Coding",
  fastest: "Fastest",
  smartest: "Smartest",
};

export const models = [
  {
    name: "GPT-5.1",
    value: "gpt-5.1-2025-11-13",
    description: "General purpose OpenAI model",
    author: "openai",
    features: ["reasoning", "smart", "fast"],
  },
  {
    name: "GPT-5.1 Codex",
    value: "gpt-5.1-codex",
    description: "For complex coding tasks",
    author: "openai",
    features: ["coding", "fast"],
    default: false,
  },
  {
    name: "GPT-5.1 Codex mini",
    value: "gpt-5.1-codex-mini",
    description: "For quick coding tasks",
    author: "openai",
    features: ["coding", "fast"],
    default: false,
  },
  // {
  //   name: "GPT-5 Pro",
  //   value: "gpt-5-pro",
  //   description: "For hard tasks",
  //   author: "openai",
  //   features: ["smart", "reasoning"],
  // },
  {
    name: "GPT-oss 120b",
    value: "gpt-oss-120b",
    description: "Most powerful open-weight model",
    author: "openai",
    features: ["reasoning", "fast"],
  },
  {
    name: "GPT-oss 20b",
    value: "gpt-oss-20b",
    description: "Medium-sized open-weight model",
    author: "openai",
    features: ["reasoning", "fastest", "fast"],
  },
  {
    name: "Gemini 3 Pro",
    value: "gemini-3-pro-preview",
    description: "Best for complex tasks",
    author: "google",
    features: ["smartest", "smart", "reasoning"],
  },
  {
    name: "Gemini 2.5 Flash",
    value: "gemini-2.5-flash",
    description: "Best for everyday tasks",
    author: "google",
    features: ["reasoning", "fast"],
  },
  {
    name: "Gemini 2.5 Flash Lite",
    value: "gemini-2.5-flash-lite",
    description: "Best for high volume tasks",
    author: "google",
    features: ["reasoning", "fast"],
    default: false,
  },
  {
    name: "Claude Sonnet 4.5",
    value: "claude-sonnet-4-5-20250929",
    description: "Hybrid reasoning model",
    author: "anthropic",
    features: ["reasoning", "smart", "fast"],
  },
  {
    name: "Claude Opus 4.5",
    value: "claude-opus-4-5@20251101",
    description: "All-around professional model",
    author: "anthropic",
    premium: true,
    features: ["reasoning", "smart"],
  },
  {
    name: "Claude Opus 4.1",
    value: "claude-opus-4-1-20250805",
    description: "Legacy professional model",
    author: "anthropic",
    premium: true,
    features: ["reasoning"],
    default: false,
  },
  {
    name: "Grok 4",
    value: "grok-4-0709",
    description: "xAI's most intelligent model",
    author: "xai",
    features: ["reasoning"],
  },
  {
    name: "Grok 4 Fast (Reasoning)",
    value: "grok-4-fast-reasoning",
    description: "Fast and efficient model",
    author: "xai",
    features: ["reasoning", "fast"],
  },
  {
    name: "Grok 4 Fast (Non-Reasoning)",
    value: "grok-4-fast-non-reasoning",
    description: "Fast and efficient model",
    author: "xai",
    features: ["fast"],
  },
];
