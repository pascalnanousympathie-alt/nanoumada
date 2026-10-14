/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { getAPIKey, getBaseURL } from '~/lib/.server/llm/api-key';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ollama } from 'ollama-ai-provider';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createMistral } from '@ai-sdk/mistral';
import { createCohere } from '@ai-sdk/cohere';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';

export const DEFAULT_NUM_CTX = process.env.DEFAULT_NUM_CTX ? parseInt(process.env.DEFAULT_NUM_CTX, 10) : 32768;

type OptionalApiKey = string | undefined;

export function getAnthropicModel(apiKey: OptionalApiKey, model: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic(model);
}
export function getOpenAILikeModel(baseURL: string, apiKey: OptionalApiKey, model: string) {
  const openai = createOpenAI({
    baseURL,
    apiKey,
  });

  return openai(model);
}

export function getCohereAIModel(apiKey: OptionalApiKey, model: string) {
  const cohere = createCohere({
    apiKey,
  });

  return cohere(model);
}

export function getOpenAIModel(apiKey: OptionalApiKey, model: string) {
  const openai = createOpenAI({
    apiKey,
  });

  return openai(model);
}

export function getMistralModel(apiKey: OptionalApiKey, model: string) {
  const mistral = createMistral({
    apiKey,
  });

  return mistral(model);
}

/**
 * The Remix runtime can expose a ponyfill-backed Fetch Response while Node's
 * TextDecoderStream/TransformStream are native. The AI SDK's SSE parser then
 * mixes incompatible Web Stream implementations and fails before yielding any
 * Gemini text. Bridge successful response bytes into Node's native stream.
 */
const googleCompatibleFetch: typeof fetch = async (input, init) => {
  const response = await globalThis.fetch(input, init);

  // Leave error responses untouched so provider error handlers can read them.
  if (!response.ok || !response.body) {
    return response;
  }

  const reader = response.body.getReader();
  const nativeBody = new NodeReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();

        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  // Preserve normal Response metadata and methods, but expose the native
  // stream to @ai-sdk/provider-utils so pipeThrough receives matching streams.
  return new Proxy(response, {
    get(target, property) {
      if (property === 'body') {
        return nativeBody;
      }

      const value = Reflect.get(target, property, target);

      return typeof value === 'function' ? value.bind(target) : value;
    },
  }) as Response;
};

export function getGoogleModel(apiKey: OptionalApiKey, model: string) {
  const google = createGoogleGenerativeAI({
    apiKey,
    fetch: googleCompatibleFetch,
  });

  return google(model);
}

export function getGroqModel(apiKey: OptionalApiKey, model: string) {
  const openai = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey,
  });

  return openai(model);
}

export function getHuggingFaceModel(apiKey: OptionalApiKey, model: string) {
  const openai = createOpenAI({
    baseURL: 'https://api-inference.huggingface.co/v1/',
    apiKey,
  });

  return openai(model);
}

export function getOllamaModel(baseURL: string, model: string) {
  const ollamaInstance = ollama(model, {
    numCtx: DEFAULT_NUM_CTX,
  }) as LanguageModelV1 & { config: any };

  ollamaInstance.config.baseURL = `${baseURL}/api`;

  return ollamaInstance;
}

export function getDeepseekModel(apiKey: OptionalApiKey, model: string) {
  const openai = createOpenAI({
    baseURL: 'https://api.deepseek.com/beta',
    apiKey,
  });

  return openai(model);
}

export function getOpenRouterModel(apiKey: OptionalApiKey, model: string) {
  const openRouter = createOpenRouter({
    apiKey,
  });

  return openRouter.chat(model);
}

export function getLMStudioModel(baseURL: string, model: string) {
  const lmstudio = createOpenAI({
    baseUrl: `${baseURL}/v1`,
    apiKey: '',
  });

  return lmstudio(model);
}

export function getXAIModel(apiKey: OptionalApiKey, model: string) {
  const openai = createOpenAI({
    baseURL: 'https://api.x.ai/v1',
    apiKey,
  });

  return openai(model);
}

export function getModel(
  provider: string,
  model: string,
  env: Env,
  apiKeys?: Record<string, string>,
  providerSettings?: Record<string, IProviderSetting>,
) {
  /*
   * let apiKey; // Declare first
   * let baseURL;
   */

  const apiKey = getAPIKey(env, provider, apiKeys); // Then assign
  const baseURL = providerSettings?.[provider]?.baseUrl || getBaseURL(env, provider);

  switch (provider) {
    case 'Anthropic':
      return getAnthropicModel(apiKey, model);
    case 'OpenAI':
      return getOpenAIModel(apiKey, model);
    case 'Groq':
      return getGroqModel(apiKey, model);
    case 'Cerebras':
      return getOpenAILikeModel(baseURL, apiKey, model);
    case 'HuggingFace':
      return getHuggingFaceModel(apiKey, model);
    case 'OpenRouter':
    case 'OpenRouter Free':
      return getOpenRouterModel(apiKey, model);
    case 'Google':
      return getGoogleModel(apiKey, model);
    case 'OpenAILike':
      return getOpenAILikeModel(baseURL, apiKey, model);
    case 'Together':
      return getOpenAILikeModel(baseURL, apiKey, model);
    case 'Deepseek':
      return getDeepseekModel(apiKey, model);
    case 'Mistral':
      return getMistralModel(apiKey, model);
    case 'LMStudio':
      return getLMStudioModel(baseURL, model);
    case 'xAI':
      return getXAIModel(apiKey, model);
    case 'Cohere':
      return getCohereAIModel(apiKey, model);
    default:
      return getOllamaModel(baseURL, model);
  }
}
