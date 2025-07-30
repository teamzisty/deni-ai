import type { LanguageModelV2 } from "@ai-sdk/provider";
import type { VoidsAIChatModelId } from "./voids-ai-chat-settings";
import { OpenAICompatibleChatLanguageModel} from "@ai-sdk/openai-compatible";
import {
  type FetchFunction,
  withoutTrailingSlash,
} from "@ai-sdk/provider-utils";
// Import your model id and settings here.

export interface VoidsAIProviderSettings {
  /**
VoidsAI API key.
*/
  apiKey?: string;
  /**
Base URL for the API calls.
*/
  baseURL?: string;
  /**
Custom headers to include in the requests.
*/
  headers?: Record<string, string>;
  /**
Optional custom url query parameters to include in request urls.
*/
  queryParams?: Record<string, string>;
  /**
Custom fetch implementation. You can use it as a middleware to intercept requests,
or to provide a custom fetch implementation for e.g. testing.
*/
  fetch?: FetchFunction;
}

export interface VoidsAIProvider {
  /**
Creates a model for text generation.
*/
  (
    modelId: VoidsAIChatModelId,
    settings?: VoidsAIProviderSettings,
  ): LanguageModelV2;

  /**
Creates a chat model for text generation.
*/
  chatModel(
    modelId: VoidsAIChatModelId,
    settings?: VoidsAIProviderSettings,
  ): LanguageModelV2;
}

export function createVoidsAI(
  options: VoidsAIProviderSettings = {},
): VoidsAIProvider {
  const baseURL = withoutTrailingSlash(
    options.baseURL ?? "https://capi.voids.top/v2/",
  );

  interface CommonModelConfig {
    provider: string;
    url: ({ path }: { path: string }) => string;
    headers: () => Record<string, string>;
    fetch?: FetchFunction;
  }

  const getCommonModelConfig = (modelType: string): CommonModelConfig => ({
    provider: `voids.${modelType}`,
    url: ({ path }) => {
      const url = new URL(`${baseURL}${path}`);
      if (options.queryParams) {
        url.search = new URLSearchParams(options.queryParams).toString();
      }
      return url.toString();
    },
    headers: () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Vercel AI SDK / @workspace/voids-ai-provider",
      };
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
      return headers;
    },
    fetch: options.fetch,
  });

  const createChatModel = (
    modelId: VoidsAIChatModelId,
    settings: VoidsAIProviderSettings = {},
  ) => {
    return new OpenAICompatibleChatLanguageModel(modelId, getCommonModelConfig("chat"));
  };

  const provider = (
    modelId: VoidsAIChatModelId,
    settings?: VoidsAIProviderSettings,
  ) => createChatModel(modelId, settings);

  provider.chatModel = createChatModel;

  return provider;
}

// Export default instance
export const VoidsAI = createVoidsAI();
