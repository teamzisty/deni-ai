export interface modelDescriptionType {
  [key: string]: ImodelDescriptionType;
}
export interface ImodelDescriptionType {
  canary?: boolean;
  displayName: string;
  offline?: boolean;
  toolDisabled?: boolean;
  vision?: boolean;
  fast?: boolean;
  defaultVisibility?: boolean;
  knowledgeCutoff?: string;
  reasoning?: boolean;
  type: modelType;
}

export type modelType = "ChatGPT" | "Gemini" | "Claude" | "Grok" | "DeepSeek";

export const modelDescriptions: modelDescriptionType = {
  "gpt-4o-2024-08-06": {
    displayName: "GPT-4o",
    knowledgeCutoff: "2023/10",
    defaultVisibility: true,
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
  "o3-mini-2025-01-31": {
    displayName: "o3-mini",
    knowledgeCutoff: "2023/10",
    defaultVisibility: true,
    reasoning: true,
    canary: true,
    type: "ChatGPT",
  },
  "o1-2024-12-17": {
    displayName: "o1",
    knowledgeCutoff: "2023/10",
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
  "gemini-2.0-flash-001": {
    displayName: "Gemini 2.0 Flash",
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
  "claude-3-7-sonnet-20250219": {
    displayName: "Claude 3.7 Sonnet",
    knowledgeCutoff: "2024/10",
    defaultVisibility: true,
    canary: true,
    vision: true,
    type: "Claude",
  },
  "claude-3.7-sonnet-thinking": {
    displayName: "Claude 3.7 Sonnet (Reasoning)",
    knowledgeCutoff: "2024/10",
    canary: true,
    vision: true,
    type: "Claude",
  },
  "anthropic.claude-3-5-sonnet-20241022-v2:0": {
    displayName: "Claude 3.5 Sonnet",
    knowledgeCutoff: "2024/04",
    canary: true,
    vision: true,
    type: "Claude",
  },
  "DeepSeek-R1": {
    displayName: "DeepSeek R1",
    knowledgeCutoff: "2024/07",
    offline: true,
    toolDisabled: true,
    reasoning: true,
    canary: true,
    type: "DeepSeek",
  },
  "deepseek-r1-distill-llama-70b": {
    displayName: "DeepSeek R1 Distill",
    knowledgeCutoff: "2024/07",
    defaultVisibility: true,
    reasoning: true,
    canary: true,
    toolDisabled: true,
    type: "DeepSeek",
  },
  "DeepSeek-V3-0324": {
    displayName: "DeepSeek V3 (03/24)",
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
