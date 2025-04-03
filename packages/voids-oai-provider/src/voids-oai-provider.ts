import type { LanguageModelV1 } from "@ai-sdk/provider";
import type { VoidsOAIChatModelId } from "./voids-oai-chat-settings";
import type { VoidsOAIChatSettings } from "./voids-oai-chat-settings";
import { OpenAICompatibleChatLanguageModel } from "@ai-sdk/openai-compatible";
import {
  type FetchFunction,
  withoutTrailingSlash,
} from "@ai-sdk/provider-utils";
// Import your model id and settings here.

export interface VoidsOAIProviderSettings {
  /**
VoidsOAI API key.
*/
  apiKey?: string;
  /**
Base URL for the API calls.
*/
  baseURL?: string;
  /**
Is Canary
*/
  isCanary?: boolean;
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

export interface VoidsOAIProvider {
  /**
Creates a model for text generation.
*/
  (
    modelId: VoidsOAIChatModelId,
    settings?: VoidsOAIChatSettings
  ): LanguageModelV1;

  /**
Creates a chat model for text generation.
*/
  chatModel(
    modelId: VoidsOAIChatModelId,
    settings?: VoidsOAIChatSettings
  ): LanguageModelV1;
}

export function createVoidsOAI(
  options: VoidsOAIProviderSettings = {}
): VoidsOAIProvider {
  const baseURL = withoutTrailingSlash(
    options.baseURL ?? "https://capi.voids.top/v1/"
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
        "User-Agent": "deni-ai v2^",
      };
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
      return headers;
    },
    fetch: options.fetch,
  });

  const createChatModel = (
    modelId: VoidsOAIChatModelId,
    settings: VoidsOAIChatSettings = {}
  ) => {
    return new OpenAICompatibleChatLanguageModel(modelId, settings, {
      ...getCommonModelConfig("chat"),
      defaultObjectGenerationMode: "tool",
    });
  };

  const provider = (
    modelId: VoidsOAIChatModelId,
    settings?: VoidsOAIChatSettings
  ) => createChatModel(modelId, settings);

  provider.chatModel = createChatModel;

  return provider;
}

// Export default instance
export const VoidsOAI = createVoidsOAI();
