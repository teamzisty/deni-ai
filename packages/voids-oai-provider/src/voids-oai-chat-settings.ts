import type { OpenAICompatibleChatSettings } from '@ai-sdk/openai-compatible';

export type VoidsOAIChatModelId =
  | 'gpt-4-0613'
  | 'gpt-4o-2024-08-06'
  | 'gpt-4-turbo-2024-04-09'
  | 'gpt-4o-mini-2024-07-18'
  | 'gpt-35-turbo-16k'
  | 'gpt-3.5-turbo-0125'
  | 'gpt-4'
  | 'gpt-3.5-turbo-instruct:20230824-v2'
  | 'gpt-4o-2024-11-20'
  | 'gpt-4-32k'
  | 'o3-mini-2025-01-31'
  | 'o1-2024-12-17'
  | 'gpt-4o-2024-05-13'
  | 'gpt-4.5-preview-2025-02-27'
  | 'gpt-3.5-turbo-0301'
  | 'o1-mini-2024-09-12'
  | 'o1-preview-2024-09-12'
  | 'chatgpt-4o-latest'
  | 'gpt-4-0125-preview'
  | 'gpt-3.5-turbo-1106'
  | 'gpt-4-1106-preview'
  | 'gpt-3.5-turbo-16k-0613'
  | 'gpt-4o-search-preview-2025-03-11'
  | (string & {});

export interface VoidsOAIChatSettings extends OpenAICompatibleChatSettings {
    isCanary?: boolean
}