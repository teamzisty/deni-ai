import type { OpenAICompatibleChatSettings } from "@ai-sdk/openai-compatible";

export type VoidsAPChatModelId =
  | "us.anthropic.claude-3-5-sonnet-20240620-v1:0"
  | "anthropic.claude-3-haiku-20240307-v1:0"
  | "us.anthropic.claude-3-haiku-20240307-v1:0"
  | "anthropic.claude-3-5-sonnet-20241022-v2:0"
  | "anthropic.claude-3-5-sonnet-20240620-v1:0"
  | "claude-3-5-sonnet-20240620"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022"
  | "claude-3-7-sonnet-20250219"
  | "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
  | "claude-3-haiku-20240307"
  | "claude-3-opus-20240229"
  | "anthropic.claude-3-sonnet-20240229-v1:0"
  | "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
  | (string & {});

export interface VoidsAPChatSettings extends OpenAICompatibleChatSettings {
  isCanary?: boolean;
}
