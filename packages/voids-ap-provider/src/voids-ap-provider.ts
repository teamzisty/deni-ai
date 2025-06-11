import type { LanguageModelV1 } from "@ai-sdk/provider";
import type { VoidsAPChatModelId } from "./voids-ap-chat-settings";
import type { VoidsAPChatSettings } from "./voids-ap-chat-settings";
import { VoidsAPChatLanguageModel } from "./voids-ap-chat-language-model";
import {
  type FetchFunction,
  withoutTrailingSlash,
} from "@ai-sdk/provider-utils";
// Import your model id and settings here.

export interface VoidsAPProviderSettings {
  /**
VoidsAP API key.
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

export interface VoidsAPProvider {
  /**
Creates a model for text generation.
*/
  (
    modelId: VoidsAPChatModelId,
    settings?: VoidsAPChatSettings,
  ): LanguageModelV1;

  /**
Creates a chat model for text generation.
*/
  chatModel(
    modelId: VoidsAPChatModelId,
    settings?: VoidsAPChatSettings,
  ): LanguageModelV1;
}

export function createVoidsAP(
  options: VoidsAPProviderSettings = {},
): VoidsAPProvider {
  const baseURL = withoutTrailingSlash(
    (options.baseURL ?? options.isCanary)
      ? "https://capi.voids.top/v1/"
      : "https://api.voids.top/v1/",
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
    modelId: VoidsAPChatModelId,
    settings: VoidsAPChatSettings = {},
  ) => {
    const modelSettings = { ...settings };
    return new VoidsAPChatLanguageModel(modelId, modelSettings, {
      ...getCommonModelConfig("chat"),
      defaultObjectGenerationMode: "tool",
    });
  };

  const provider = (
    modelId: VoidsAPChatModelId,
    settings?: VoidsAPChatSettings,
  ) => createChatModel(modelId, settings);

  provider.chatModel = createChatModel;

  return provider;
}

// Export default instance
export const VoidsAP = createVoidsAP();
