export interface modelDescriptionType {
  [key: string]: ImodelDescriptionType;
}
export interface ImodelDescriptionType {
  canary?: boolean;
  displayName: string;
  offline?: boolean;
  toolDisabled?: boolean;
  reasoningEffort?: reasoningEffortType[];
  vision?: boolean;
  pdfSupport?: boolean;
  fast?: boolean;
  defaultVisibility?: boolean;
  knowledgeCutoff?: string;
  reasoning?: boolean;
  type: modelType;
}

export type modelType = "ChatGPT" | "Gemini" | "Claude" | "Grok" | "DeepSeek";
export type reasoningEffortType = "low" | "medium" | "high";

export const modelDescriptions: modelDescriptionType = {
  "gpt-4o-2024-08-06": {
    displayName: "GPT-4o",
    knowledgeCutoff: "2023/10",
    defaultVisibility: true,
    canary: true,
    vision: true,
    type: "ChatGPT",
  },
  "gpt-4o-search-preview-2025-03-11": {
    displayName: "GPT-4o Search Preview",
    knowledgeCutoff: "2023/10",
    defaultVisibility: true,
    offline: true,
    toolDisabled: true,
    canary: true,
    vision: true,
    type: "ChatGPT",
  },
  "gpt-4o-mini-2024-07-18": {
    displayName: "GPT-4o mini",
    knowledgeCutoff: "2023/10",
    defaultVisibility: true,
    vision: true,
    canary: true,
    fast: true,
    type: "ChatGPT",
  },
  "chatgpt-4o-latest": {
    displayName: "GPT-4o Latest",
    knowledgeCutoff: "2023/10",
    toolDisabled: true,
    canary: true,
    vision: true,
    type: "ChatGPT",
  },
  "o3-mini-2025-01-31": {
    displayName: "o3-mini",
    knowledgeCutoff: "2023/10",
    reasoningEffort: ["low", "medium", "high"],
    defaultVisibility: true,
    reasoning: true,
    canary: true,
    type: "ChatGPT",
  },
  "o1-2024-12-17": {
    displayName: "o1",
    knowledgeCutoff: "2023/10",
    reasoningEffort: ["low", "medium", "high"],
    canary: true,
    reasoning: true,
    vision: true,
    type: "ChatGPT",
  },
  "o1-mini-2024-09-12": {
    displayName: "o1-mini",
    knowledgeCutoff: "2023/10",
    reasoning: true,
    canary: true,
    type: "ChatGPT",
  },
  "gpt-4.5-preview-2025-02-27": {
    displayName: "GPT-4.5 Preview",
    knowledgeCutoff: "2023/10",
    defaultVisibility: true,
    canary: true,
    reasoning: true,
    vision: true,
    type: "ChatGPT",
  },
  "gpt-4-turbo-2024-04-09": {
    displayName: "GPT-4 Turbo",
    knowledgeCutoff: "2023/12",
    canary: true,
    vision: true,
    type: "ChatGPT",
  },
  "gpt-4-0613": {
    displayName: "GPT-4",
    knowledgeCutoff: "2023/12",
    canary: true,
    type: "ChatGPT",
  },
  "gpt-3.5-turbo-0125": {
    displayName: "GPT-3.5 Turbo",
    knowledgeCutoff: "2022/01",
    canary: true,
    type: "ChatGPT",
  },
  "gemini-2.5-pro-exp-03-25": {
    displayName: "Gemini 2.5 Pro",
    knowledgeCutoff: "2025/01",
    defaultVisibility: true,
    vision: true,
    canary: true,
    type: "Gemini",
  },
  "gemini-2.0-pro-exp-02-05": {
    displayName: "Gemini 2.0 Pro",
    knowledgeCutoff: "-",
    vision: true,
    canary: true,
    type: "Gemini",
  },
  "gemini-2.0-flash-001": {
    displayName: "Gemini 2.0 Flash",
    knowledgeCutoff: "2024/06",
    defaultVisibility: true,
    fast: true,
    vision: true,
    canary: true,
    type: "Gemini",
  },
  "gemini-2.0-flash-thinking-exp-01-21": {
    displayName: "Gemini 2.0 Flash Thinking",
    knowledgeCutoff: "2024/06",
    defaultVisibility: true,
    reasoning: true,
    toolDisabled: true,
    fast: true,
    vision: true,
    canary: true,
    type: "Gemini",
  },
  "gemini-2.0-flash-lite-001": {
    displayName: "Gemini 2.0 Flash Lite",
    knowledgeCutoff: "2024/06",
    defaultVisibility: true,
    fast: true,
    vision: true,
    canary: true,
    type: "Gemini",
  },
  "gemini-1.5-pro": {
    displayName: "Gemini 1.5 Pro",
    knowledgeCutoff: "2023/11",
    canary: true,
    vision: true,
    fast: true,
    type: "Gemini",
  },
  "us.anthropic.claude-3-7-sonnet-20250219-v1:0": {
    displayName: "Claude 3.7 Sonnet",
    knowledgeCutoff: "2024/10",
    defaultVisibility: true,
    pdfSupport: true,
    canary: true,
    vision: true,
    type: "Claude",
  },
  "us.anthropic.claude-3-7-sonnet-20250219-v1:0-reasoning": {
    displayName: "Claude 3.7 Sonnet (Extended Thinking)",
    knowledgeCutoff: "2022/01",
    canary: true,
    reasoning: true,
    vision: true,
    toolDisabled: true,
    type: "Claude",
  },
  "anthropic.claude-3-5-sonnet-20241022-v2:0": {
    displayName: "Claude 3.5 Sonnet",
    knowledgeCutoff: "2024/04",
    pdfSupport: true,
    canary: true,
    vision: true,
    type: "Claude",
  },
  "deepseek-r1-250120": {
    displayName: "DeepSeek R1",
    knowledgeCutoff: "2024/07",
    reasoning: true,
    toolDisabled: true,
    canary: true,
    type: "DeepSeek",
  },
  "deepseek-chat": {
    displayName: "DeepSeek V3",
    knowledgeCutoff: "2023/10",
    fast: true,
    canary: true,
    toolDisabled: true,
    type: "DeepSeek",
  },
  "grok-3": {
    displayName: "Grok 3",
    knowledgeCutoff: "-",
    type: "Grok",
  },
  "grok-3-r1": {
    displayName: "Grok 3 (Think)",
    knowledgeCutoff: "-",
    reasoning: true,
    type: "Grok",
  },
};
