import { NoSuchModelError, ProviderV1 } from '@ai-sdk/provider';
import { EmbeddingModel, ImageModel, LanguageModel } from '../types';
import { NoSuchProviderError } from './no-such-provider-error';

type ExtractLiteralUnion<T> = T extends string
  ? string extends T
    ? never
    : T
  : never;

export interface ProviderRegistryProvider<
  PROVIDERS extends Record<string, ProviderV1> = Record<string, ProviderV1>,
> {
  languageModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string
      ? `${KEY & string}:${ExtractLiteralUnion<Parameters<NonNullable<PROVIDERS[KEY]['languageModel']>>[0]>}`
      : never,
  ): LanguageModel;
  languageModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? `${KEY & string}:${string}` : never,
  ): LanguageModel;

  textEmbeddingModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string
      ? `${KEY & string}:${ExtractLiteralUnion<Parameters<NonNullable<PROVIDERS[KEY]['textEmbeddingModel']>>[0]>}`
      : never,
  ): EmbeddingModel<string>;
  textEmbeddingModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? `${KEY & string}:${string}` : never,
  ): EmbeddingModel<string>;

  imageModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string
      ? `${KEY & string}:${ExtractLiteralUnion<Parameters<NonNullable<PROVIDERS[KEY]['imageModel']>>[0]>}`
      : never,
  ): ImageModel;
  imageModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? `${KEY & string}:${string}` : never,
  ): ImageModel;
}

/**
 * Creates a registry for the given providers.
 */
export function experimental_createProviderRegistry<
  PROVIDERS extends Record<string, ProviderV1>,
>(providers: PROVIDERS): ProviderRegistryProvider<PROVIDERS> {
  const registry = new DefaultProviderRegistry<PROVIDERS>();

  for (const [id, provider] of Object.entries(providers)) {
    registry.registerProvider({ id, provider } as {
      id: keyof PROVIDERS;
      provider: PROVIDERS[keyof PROVIDERS];
    });
  }

  return registry;
}

class DefaultProviderRegistry<PROVIDERS extends Record<string, ProviderV1>>
  implements ProviderRegistryProvider<PROVIDERS>
{
  private providers: PROVIDERS = {} as PROVIDERS;

  registerProvider<K extends keyof PROVIDERS>({
    id,
    provider,
  }: {
    id: K;
    provider: PROVIDERS[K];
  }): void {
    this.providers[id] = provider;
  }

  private getProvider(id: string): ProviderV1 {
    const provider = this.providers[id as keyof PROVIDERS];

    if (provider == null) {
      throw new NoSuchProviderError({
        modelId: id,
        modelType: 'languageModel',
        providerId: id,
        availableProviders: Object.keys(this.providers),
      });
    }

    return provider;
  }

  private splitId(
    id: string,
    modelType: 'languageModel' | 'textEmbeddingModel' | 'imageModel',
  ): [string, string] {
    const index = id.indexOf(':');

    if (index === -1) {
      throw new NoSuchModelError({
        modelId: id,
        modelType,
        message:
          `Invalid ${modelType} id for registry: ${id} ` +
          `(must be in the format "providerId:modelId")`,
      });
    }

    return [id.slice(0, index), id.slice(index + 1)];
  }

  languageModel<KEY extends keyof PROVIDERS>(
    id: `${KEY & string}:${string}`,
  ): LanguageModel {
    const [providerId, modelId] = this.splitId(id, 'languageModel');
    const model = this.getProvider(providerId).languageModel?.(modelId);

    if (model == null) {
      throw new NoSuchModelError({ modelId: id, modelType: 'languageModel' });
    }

    return model;
  }

  textEmbeddingModel<KEY extends keyof PROVIDERS>(
    id: `${KEY & string}:${string}`,
  ): EmbeddingModel<string> {
    const [providerId, modelId] = this.splitId(id, 'textEmbeddingModel');
    const provider = this.getProvider(providerId);

    const model = provider.textEmbeddingModel?.(modelId);

    if (model == null) {
      throw new NoSuchModelError({
        modelId: id,
        modelType: 'textEmbeddingModel',
      });
    }

    return model;
  }

  imageModel<KEY extends keyof PROVIDERS>(
    id: `${KEY & string}:${string}`,
  ): ImageModel {
    const [providerId, modelId] = this.splitId(id, 'imageModel');
    const provider = this.getProvider(providerId);

    const model = provider.imageModel?.(modelId);

    if (model == null) {
      throw new NoSuchModelError({ modelId: id, modelType: 'imageModel' });
    }

    return model;
  }
}
