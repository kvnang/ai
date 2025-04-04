import { openai } from '@ai-sdk/openai';
import { generateText, LanguageModelV2Middleware, wrapLanguageModel } from 'ai';
import 'dotenv/config';

const logProviderMetadataMiddleware: LanguageModelV2Middleware = {
  transformParams: async ({ params }) => {
    console.log(
      'providerMetadata: ' + JSON.stringify(params.providerMetadata, null, 2),
    );
    return params;
  },
};

async function main() {
  const { text } = await generateText({
    model: wrapLanguageModel({
      model: openai('gpt-4o'),
      middleware: logProviderMetadataMiddleware,
    }),
    providerOptions: {
      myMiddleware: {
        example: 'value',
      },
    },
    prompt: 'Invent a new holiday and describe its traditions.',
  });

  console.log(text);
}

main().catch(console.error);
