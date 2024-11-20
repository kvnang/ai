import {
  EmbeddingModelV1,
  LanguageModelV1,
  ProviderV1,
} from '@ai-sdk/provider';
import {
  FetchFunction,
  loadApiKey,
  withoutTrailingSlash,
} from '@ai-sdk/provider-utils';
import { OpenAICompatibleChatLanguageModel } from './openai-compatible-chat-language-model';
import { OpenAICompatibleChatSettings } from './openai-compatible-chat-settings';
import { OpenAICompatibleCompletionLanguageModel } from './openai-compatible-completion-language-model';
import { OpenAICompatibleCompletionSettings } from './openai-compatible-completion-settings';
import { OpenAICompatibleEmbeddingSettings } from './openai-compatible-embedding-settings';
import { OpenAICompatibleEmbeddingModel } from './openai-compatible-embedding-model';

export interface OpenAICompatibleProvider<
  CHAT_MODEL_IDS extends string = string,
  COMPLETION_MODEL_IDS extends string = string,
  EMBEDDING_MODEL_IDS extends string = string,
> extends ProviderV1 {
  (
    modelId: CHAT_MODEL_IDS,
    settings?: OpenAICompatibleChatSettings,
  ): LanguageModelV1;

  languageModel(
    modelId: CHAT_MODEL_IDS,
    settings?: OpenAICompatibleChatSettings,
  ): LanguageModelV1;

  chatModel(
    modelId: CHAT_MODEL_IDS,
    settings?: OpenAICompatibleChatSettings,
  ): LanguageModelV1;

  completionModel(
    modelId: COMPLETION_MODEL_IDS,
    settings?: OpenAICompatibleCompletionSettings,
  ): LanguageModelV1;

  textEmbeddingModel(
    modelId: EMBEDDING_MODEL_IDS,
    settings?: OpenAICompatibleEmbeddingSettings,
  ): EmbeddingModelV1<string>;
}

export interface OpenAICompatibleProviderSettings {
  /**
Base URL for the API calls.
     */
  baseURL?: string;

  /**
API key for authenticating requests.
     */
  apiKey?: string;

  /**
Custom headers to include in the requests.
     */
  headers?: Record<string, string>;

  /**
Custom fetch implementation. You can use it as a middleware to intercept requests,
or to provide a custom fetch implementation for e.g. testing.
    */
  fetch?: FetchFunction;

  /**
The name of the environment variable from which to load the API key (if a key isn't explicitly provided).
   */
  apiKeyEnvVarName?: string;

  /**
Description of the API key environment variable (for use in error messages).
   */
  apiKeyEnvVarDescription?: string;

  /**
Provider name. Overrides the `openai` default name for 3rd party providers.
   */
  name?: string;
}

/**
Create an OpenAICompatible provider instance.
 */
export function createOpenAICompatible<
  CHAT_MODEL_IDS extends string,
  COMPLETION_MODEL_IDS extends string,
  EMBEDDING_MODEL_IDS extends string,
>(
  options: OpenAICompatibleProviderSettings,
): OpenAICompatibleProvider<
  CHAT_MODEL_IDS,
  COMPLETION_MODEL_IDS,
  EMBEDDING_MODEL_IDS
> {
  // TODO(shaper): force only 'compatible' -- look into whether we can remove some 'strict' logic/configs entirely

  if (!options.baseURL) {
    throw new Error('Base URL is required');
  }
  const baseURL = withoutTrailingSlash(options.baseURL);

  if (!options.name) {
    throw new Error('Provider name is required');
  }
  const providerName = options.name;

  const apiKey = loadApiKey({
    apiKey: options.apiKey,
    environmentVariableName: options.apiKeyEnvVarName ?? '',
    description: options.apiKeyEnvVarDescription ?? '',
  });
  if (!apiKey) {
    throw new Error('API key is required');
  }

  const getHeaders = () => ({
    Authorization: `Bearer ${apiKey}`,
    ...options.headers,
  });

  const createLanguageModel = (
    modelId: CHAT_MODEL_IDS,
    settings?: OpenAICompatibleChatSettings,
  ) => createChatModel(modelId, settings);

  const createChatModel = (
    modelId: CHAT_MODEL_IDS,
    settings: OpenAICompatibleChatSettings = {},
  ) =>
    new OpenAICompatibleChatLanguageModel(modelId, settings, {
      provider: `${providerName}.chat`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createCompletionModel = (
    modelId: COMPLETION_MODEL_IDS,
    settings: OpenAICompatibleCompletionSettings = {},
  ) =>
    new OpenAICompatibleCompletionLanguageModel(modelId, settings, {
      provider: `${providerName}.completion`,
      compatibility: 'compatible',
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createEmbeddingModel = (
    modelId: EMBEDDING_MODEL_IDS,
    settings: OpenAICompatibleEmbeddingSettings = {},
  ) =>
    new OpenAICompatibleEmbeddingModel(modelId, settings, {
      provider: `${providerName}.embedding`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const provider = function (
    modelId: CHAT_MODEL_IDS,
    settings?: OpenAICompatibleChatSettings,
  ) {
    return createLanguageModel(modelId, settings);
  };

  provider.languageModel = createLanguageModel;
  provider.chatModel = createChatModel;
  provider.completionModel = createCompletionModel;
  provider.textEmbeddingModel = createEmbeddingModel;

  return provider as OpenAICompatibleProvider<
    CHAT_MODEL_IDS,
    COMPLETION_MODEL_IDS,
    EMBEDDING_MODEL_IDS
  >;
}
