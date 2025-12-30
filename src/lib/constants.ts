export type Author =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "openai_compatible";

export enum AuthorEnum {
  openai = "OpenAI",
  anthropic = "Anthropic",
  google = "Google",
  xai = "xAI",
  openai_compatible = "OpenAI-compatible",
}

export type Models = {
  [key: string]: {
    author: Author;
    model: string;
    label: string;
    provider: string;
  };
};

export const models = [
  {
    name: "GPT-5.2",
    value: "gpt-5.2",
    author: "openai",
    features: ["reasoning", "smart", "fast"],
  },
  {
    name: "GPT-5.1 Codex",
    value: "gpt-5.1-codex",
    author: "openai",
    features: ["coding", "fast"],
    default: false,
  },
  {
    name: "GPT-5.1 Codex mini",
    value: "gpt-5.1-codex-mini",
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
    value: "openai/gpt-oss-120b",
    author: "openai",
    provider: "groq",
    features: ["reasoning", "fast"],
  },
  {
    name: "GPT-oss 20b",
    value: "openai/gpt-oss-20b",
    author: "openai",
    provider: "groq",
    features: ["reasoning", "fastest", "fast"],
  },
  {
    name: "Gemini 3 Pro",
    value: "gemini-3-pro-preview",
    author: "google",
    features: ["smartest", "smart", "reasoning"],
  },
  {
    name: "Gemini 2.5 Flash",
    value: "gemini-2.5-flash",
    author: "google",
    features: ["reasoning", "fast"],
  },
  {
    name: "Gemini 2.5 Flash Lite",
    value: "gemini-2.5-flash-lite",
    author: "google",
    features: ["reasoning", "fast"],
    default: false,
  },
  {
    name: "Claude Sonnet 4.5",
    value: "claude-sonnet-4-5",
    author: "anthropic",
    premium: true,
    features: ["reasoning", "smart", "fast"],
  },
  {
    name: "Claude Opus 4.5",
    value: "claude-opus-4-5",
    author: "anthropic",
    premium: true,
    features: ["reasoning", "smart"],
  },
  {
    name: "Claude Opus 4.1",
    value: "claude-opus-4-1",
    author: "anthropic",
    premium: true,
    features: ["reasoning"],
    default: false,
  },
  {
    name: "Grok 4",
    value: "grok-4-0709",
    author: "xai",
    features: ["reasoning"],
  },
  {
    name: "Grok 4 Fast (Reasoning)",
    value: "grok-4-fast-reasoning",
    author: "xai",
    features: ["reasoning", "fast"],
  },
  {
    name: "Grok 4 Fast (Non-Reasoning)",
    value: "grok-4-fast-non-reasoning",
    author: "xai",
    features: ["fast"],
  },
];
