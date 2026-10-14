import Cookies from 'js-cookie';
import { isExplicitlyFreeModel } from './free-provider-utils';
import type { ModelInfo, OllamaApiResponse, OllamaModel } from './types';
import type { ProviderInfo, IProviderSetting } from '~/types/model';
import { createScopedLogger } from './logger';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'bolt_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';

const logger = createScopedLogger('Constants');

const PROVIDER_LIST: ProviderInfo[] = [
  {
    name: 'Anthropic',
    staticModels: [
      {
        name: 'claude-3-5-sonnet-latest',
        label: 'Claude 3.5 Sonnet (new)',
        provider: 'Anthropic',
        maxTokenAllowed: 8000,
      },
      {
        name: 'claude-3-5-sonnet-20240620',
        label: 'Claude 3.5 Sonnet (old)',
        provider: 'Anthropic',
        maxTokenAllowed: 8000,
      },
      {
        name: 'claude-3-5-haiku-latest',
        label: 'Claude 3.5 Haiku (new)',
        provider: 'Anthropic',
        maxTokenAllowed: 8000,
      },
      { name: 'claude-3-opus-latest', label: 'Claude 3 Opus', provider: 'Anthropic', maxTokenAllowed: 8000 },
      { name: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', provider: 'Anthropic', maxTokenAllowed: 8000 },
      { name: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', provider: 'Anthropic', maxTokenAllowed: 8000 },
    ],
    getApiKeyLink: 'https://console.anthropic.com/settings/keys',
  },
  {
    name: 'Ollama',
    staticModels: [],
    getDynamicModels: getOllamaModels,
    getApiKeyLink: 'https://ollama.com/download',
    labelForGetApiKey: 'Download Ollama',
    icon: 'i-ph:cloud-arrow-down',
    freeTierNote: 'Local models; no hosted API quota, but inference uses the computer memory/CPU/GPU and storage.',
  },
  {
    name: 'OpenAILike',
    staticModels: [],
    getDynamicModels: getOpenAILikeModels,
    freeTierNote: 'Custom OpenAI-compatible endpoint; free quota and charges depend on the URL/provider you configure.',
  },
  {
    name: 'Cohere',
    staticModels: [
      { name: 'command-r-plus-08-2024', label: 'Command R plus Latest', provider: 'Cohere', maxTokenAllowed: 4096 },
      { name: 'command-r-08-2024', label: 'Command R Latest', provider: 'Cohere', maxTokenAllowed: 4096 },
      { name: 'command-r-plus', label: 'Command R plus', provider: 'Cohere', maxTokenAllowed: 4096 },
      { name: 'command-r', label: 'Command R', provider: 'Cohere', maxTokenAllowed: 4096 },
      { name: 'command', label: 'Command', provider: 'Cohere', maxTokenAllowed: 4096 },
      { name: 'command-nightly', label: 'Command Nightly', provider: 'Cohere', maxTokenAllowed: 4096 },
      { name: 'command-light', label: 'Command Light', provider: 'Cohere', maxTokenAllowed: 4096 },
      { name: 'command-light-nightly', label: 'Command Light Nightly', provider: 'Cohere', maxTokenAllowed: 4096 },
      { name: 'c4ai-aya-expanse-8b', label: 'c4AI Aya Expanse 8b', provider: 'Cohere', maxTokenAllowed: 4096 },
      { name: 'c4ai-aya-expanse-32b', label: 'c4AI Aya Expanse 32b', provider: 'Cohere', maxTokenAllowed: 4096 },
    ],
    getApiKeyLink: 'https://dashboard.cohere.com/api-keys',
  },
  {
    name: 'OpenRouter',
    staticModels: [],
    getDynamicModels: getOpenRouterModels,
    getApiKeyLink: 'https://openrouter.ai/settings/keys',
    freeTierNote:
      'Contains both free and paid models; choose the separate OpenRouter Free option to exclude priced models.',
    freeTierUrl: 'https://openrouter.ai/pricing',
  },

  {
    name: 'OpenRouter Free',
    staticModels: [],
    getDynamicModels: getOpenRouterFreeModels,
    getApiKeyLink: 'https://openrouter.ai/settings/keys',
    freeTierNote:
      'Zero-priced models only; OpenRouter currently lists a 50-requests/day Free plan limit. Availability and quotas may change.',
    freeTierUrl: 'https://openrouter.ai/pricing',
  },
  {
    name: 'Google',
    staticModels: [
      { name: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash — free tier', provider: 'Google', maxTokenAllowed: 8000 },
      { name: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash — free tier', provider: 'Google', maxTokenAllowed: 8000 },
      {
        name: 'gemini-3.5-flash-lite',
        label: 'Gemini 3.5 Flash-Lite — free tier',
        provider: 'Google',
        maxTokenAllowed: 8000,
      },
      {
        name: 'gemini-3.1-flash-lite',
        label: 'Gemini 3.1 Flash-Lite — free tier',
        provider: 'Google',
        maxTokenAllowed: 8000,
      },
      {
        name: 'gemini-3-flash-preview',
        label: 'Gemini 3 Flash Preview — free tier',
        provider: 'Google',
        maxTokenAllowed: 8000,
      },
    ],
    getApiKeyLink: 'https://aistudio.google.com/apikey',
    freeTierNote: 'Free-tier models only in this list; RPM/TPM/RPD quotas depend on the Google project and model.',
    freeTierUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits',
  },
  {
    name: 'Groq',
    staticModels: [
      {
        name: 'openai/gpt-oss-120b',
        label: 'GPT-OSS 120B — Groq free-plan quota',
        provider: 'Groq',
        maxTokenAllowed: 8000,
      },
      {
        name: 'openai/gpt-oss-20b',
        label: 'GPT-OSS 20B — Groq free-plan quota',
        provider: 'Groq',
        maxTokenAllowed: 8000,
      },
    ],
    getApiKeyLink: 'https://console.groq.com/keys',
    freeTierNote:
      'Use only supported free-plan models; limits vary per model and account. Switch models/providers after a 429 quota error.',
    freeTierUrl: 'https://console.groq.com/docs/rate-limits',
  },
  {
    name: 'Cerebras',
    staticModels: [],
    getDynamicModels: getCerebrasModels,
    getApiKeyLink: 'https://cloud.cerebras.ai/',
    freeTierNote:
      'Free API tier at $0 with lower rate limits; key access and model availability are account-dependent. Check current official limits before use.',
    freeTierUrl: 'https://inference-docs.cerebras.ai/support/pricing',
  },
  {
    name: 'HuggingFace',
    staticModels: [
      {
        name: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        label: 'Qwen2.5-Coder-32B-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: '01-ai/Yi-1.5-34B-Chat',
        label: 'Yi-1.5-34B-Chat (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'codellama/CodeLlama-34b-Instruct-hf',
        label: 'CodeLlama-34b-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'NousResearch/Hermes-3-Llama-3.1-8B',
        label: 'Hermes-3-Llama-3.1-8B (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        label: 'Qwen2.5-Coder-32B-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'Qwen/Qwen2.5-72B-Instruct',
        label: 'Qwen2.5-72B-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'meta-llama/Llama-3.1-70B-Instruct',
        label: 'Llama-3.1-70B-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'meta-llama/Llama-3.1-405B',
        label: 'Llama-3.1-405B (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: '01-ai/Yi-1.5-34B-Chat',
        label: 'Yi-1.5-34B-Chat (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'codellama/CodeLlama-34b-Instruct-hf',
        label: 'CodeLlama-34b-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'NousResearch/Hermes-3-Llama-3.1-8B',
        label: 'Hermes-3-Llama-3.1-8B (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
    ],
    getApiKeyLink: 'https://huggingface.co/settings/tokens',
    freeTierNote: 'Free accounts currently receive a small monthly inference credit (listed as $0.10; may change).',
    freeTierUrl: 'https://huggingface.co/docs/inference-providers/pricing',
  },

  {
    name: 'OpenAI',
    staticModels: [
      { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', maxTokenAllowed: 8000 },
      { name: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI', maxTokenAllowed: 8000 },
      { name: 'gpt-4', label: 'GPT-4', provider: 'OpenAI', maxTokenAllowed: 8000 },
      { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI', maxTokenAllowed: 8000 },
    ],
    getApiKeyLink: 'https://platform.openai.com/api-keys',
  },
  {
    name: 'xAI',
    staticModels: [{ name: 'grok-beta', label: 'xAI Grok Beta', provider: 'xAI', maxTokenAllowed: 8000 }],
    getApiKeyLink: 'https://docs.x.ai/docs/quickstart#creating-an-api-key',
  },
  {
    name: 'Deepseek',
    staticModels: [
      { name: 'deepseek-coder', label: 'Deepseek-Coder', provider: 'Deepseek', maxTokenAllowed: 8000 },
      { name: 'deepseek-chat', label: 'Deepseek-Chat', provider: 'Deepseek', maxTokenAllowed: 8000 },
    ],
    getApiKeyLink: 'https://platform.deepseek.com/apiKeys',
  },
  {
    name: 'Mistral',
    staticModels: [
      { name: 'open-mistral-7b', label: 'Mistral 7B', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'open-mixtral-8x7b', label: 'Mistral 8x7B', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'open-mixtral-8x22b', label: 'Mistral 8x22B', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'open-codestral-mamba', label: 'Codestral Mamba', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'open-mistral-nemo', label: 'Mistral Nemo', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'ministral-8b-latest', label: 'Mistral 8B', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'mistral-small-latest', label: 'Mistral Small', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'codestral-latest', label: 'Codestral', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'mistral-large-latest', label: 'Mistral Large Latest', provider: 'Mistral', maxTokenAllowed: 8000 },
    ],
    getApiKeyLink: 'https://console.mistral.ai/api-keys/',
  },
  {
    name: 'LMStudio',
    staticModels: [],
    getDynamicModels: getLMStudioModels,
    getApiKeyLink: 'https://lmstudio.ai/',
    labelForGetApiKey: 'Get LMStudio',
    icon: 'i-ph:cloud-arrow-down',
    freeTierNote: 'Local model server; no hosted API quota, but it needs a running compatible LM Studio host.',
  },
  {
    name: 'Together',
    getDynamicModels: getTogetherModels,
    staticModels: [
      {
        name: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        label: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        provider: 'Together',
        maxTokenAllowed: 8000,
      },
      {
        name: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
        label: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
        provider: 'Together',
        maxTokenAllowed: 8000,
      },

      {
        name: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        label: 'Mixtral 8x7B Instruct',
        provider: 'Together',
        maxTokenAllowed: 8192,
      },
    ],
    getApiKeyLink: 'https://api.together.xyz/settings/api-keys',
  },
];

export const DEFAULT_PROVIDER = PROVIDER_LIST[0];

const staticModels: ModelInfo[] = PROVIDER_LIST.map((p) => p.staticModels).flat();

export let MODEL_LIST: ModelInfo[] = [...staticModels];

export async function getModelList(
  apiKeys: Record<string, string>,
  providerSettings?: Record<string, IProviderSetting>,
) {
  MODEL_LIST = [
    ...(
      await Promise.all(
        PROVIDER_LIST.filter(
          (p): p is ProviderInfo & { getDynamicModels: () => Promise<ModelInfo[]> } => !!p.getDynamicModels,
        ).map((p) => p.getDynamicModels(apiKeys, providerSettings?.[p.name])),
      )
    ).flat(),
    ...staticModels,
  ];
  return MODEL_LIST;
}

async function getTogetherModels(apiKeys?: Record<string, string>, settings?: IProviderSetting): Promise<ModelInfo[]> {
  try {
    const baseUrl = settings?.baseUrl || import.meta.env.TOGETHER_API_BASE_URL || '';
    const provider = 'Together';

    if (!baseUrl) {
      return [];
    }

    let apiKey = import.meta.env.OPENAI_LIKE_API_KEY ?? '';

    if (apiKeys && apiKeys[provider]) {
      apiKey = apiKeys[provider];
    }

    if (!apiKey) {
      return [];
    }

    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const res = (await response.json()) as any;
    const data: any[] = (res || []).filter((model: any) => model.type == 'chat');

    return data.map((m: any) => ({
      name: m.id,
      label: `${m.display_name} - in:$${m.pricing.input.toFixed(
        2,
      )} out:$${m.pricing.output.toFixed(2)} - context ${Math.floor(m.context_length / 1000)}k`,
      provider,
      maxTokenAllowed: 8000,
    }));
  } catch (e) {
    console.error('Error getting OpenAILike models:', e);
    return [];
  }
}

const getOllamaBaseUrl = (settings?: IProviderSetting) => {
  const defaultBaseUrl = settings?.baseUrl || import.meta.env.OLLAMA_API_BASE_URL || 'http://localhost:11434';

  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Frontend always uses localhost
    return defaultBaseUrl;
  }

  // Backend: Check if we're running in Docker
  const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

  return isDocker ? defaultBaseUrl.replace('localhost', 'host.docker.internal') : defaultBaseUrl;
};

async function getOllamaModels(apiKeys?: Record<string, string>, settings?: IProviderSetting): Promise<ModelInfo[]> {
  /*
   * if (typeof window === 'undefined') {
   * return [];
   * }
   */

  try {
    const baseUrl = getOllamaBaseUrl(settings);

    // A server-side request to localhost targets the deployment container,
    // not the user's device. Avoid one guaranteed failure on every SSR request.
    if (typeof window === 'undefined') {
      try {
        const hostname = new URL(baseUrl).hostname.toLowerCase();

        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
          return [];
        }
      } catch {
        // Let fetch below handle an invalid URL and keep the existing fallback.
      }
    }

    const response = await fetch(`${baseUrl}/api/tags`);
    const data = (await response.json()) as OllamaApiResponse;

    return data.models.map((model: OllamaModel) => ({
      name: model.name,
      label: `${model.name} (${model.details.parameter_size})`,
      provider: 'Ollama',
      maxTokenAllowed: 8000,
    }));
  } catch (e: any) {
    logger.warn('Failed to get Ollama models: ', e.message || '');
    return [];
  }
}

async function getCerebrasModels(apiKeys?: Record<string, string>): Promise<ModelInfo[]> {
  const apiKey = apiKeys?.Cerebras || import.meta.env.CEREBRAS_API_KEY || '';

  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch('https://api.cerebras.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      logger.warn(`Cerebras model catalog returned HTTP ${response.status}`);
      return [];
    }

    const result = (await response.json()) as { data?: Array<{ id?: string }> };

    return (Array.isArray(result.data) ? result.data : [])
      .filter((model) => typeof model.id === 'string' && model.id.length > 0)
      .map((model) => ({
        name: model.id as string,
        label: `${model.id} · account quota applies`,
        provider: 'Cerebras',
        maxTokenAllowed: 8000,
      }));
  } catch (error) {
    logger.warn('Failed to load Cerebras models:', error);
    return [];
  }
}

async function getOpenAILikeModels(
  apiKeys?: Record<string, string>,
  settings?: IProviderSetting,
): Promise<ModelInfo[]> {
  try {
    const baseUrl = settings?.baseUrl || import.meta.env.OPENAI_LIKE_API_BASE_URL || '';

    if (!baseUrl) {
      return [];
    }

    let apiKey = '';

    if (apiKeys && apiKeys.OpenAILike) {
      apiKey = apiKeys.OpenAILike;
    }

    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const res = (await response.json()) as any;

    return res.data.map((model: any) => ({
      name: model.id,
      label: model.id,
      provider: 'OpenAILike',
    }));
  } catch (e) {
    console.error('Error getting OpenAILike models:', e);
    return [];
  }
}

type OpenRouterModelsResponse = {
  data: {
    name: string;
    id: string;
    context_length: number;
    pricing: {
      prompt: number | string | null;
      completion: number | string | null;
    };
  }[];
};

async function fetchOpenRouterModelCatalog(): Promise<OpenRouterModelsResponse['data']> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter model catalog returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as OpenRouterModelsResponse;

    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    logger.warn('Failed to load OpenRouter models:', error);
    return [];
  }
}

async function getOpenRouterModels(): Promise<ModelInfo[]> {
  const models = await fetchOpenRouterModelCatalog();

  return models
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => ({
      name: m.id,
      label: `${m.name} - in:$${(Number(m.pricing.prompt) * 1_000_000).toFixed(
        2,
      )} out:$${(Number(m.pricing.completion) * 1_000_000).toFixed(2)} - context ${Math.floor(m.context_length / 1000)}k`,
      provider: 'OpenRouter',
      maxTokenAllowed: 8000,
    }));
}

async function getOpenRouterFreeModels(): Promise<ModelInfo[]> {
  const models = await fetchOpenRouterModelCatalog();

  const listedFreeModels = models
    .filter(
      (model) =>
        model.id !== 'openrouter/free' && isExplicitlyFreeModel(model.pricing?.prompt, model.pricing?.completion),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((model) => ({
      name: model.id,
      label: `FREE · ${model.name} · context ${Math.floor(model.context_length / 1000)}k`,
      provider: 'OpenRouter Free',
      maxTokenAllowed: 8000,
    }));

  // OpenRouter documents this router ID as a way to auto-select an available free model.
  return [
    {
      name: 'openrouter/free',
      label: 'FREE · Auto-route to an available free model',
      provider: 'OpenRouter Free',
      maxTokenAllowed: 8000,
    },
    ...listedFreeModels,
  ];
}

async function getLMStudioModels(_apiKeys?: Record<string, string>, settings?: IProviderSetting): Promise<ModelInfo[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const baseUrl = settings?.baseUrl || import.meta.env.LMSTUDIO_API_BASE_URL || 'http://localhost:1234';
    const response = await fetch(`${baseUrl}/v1/models`);
    const data = (await response.json()) as any;

    return data.data.map((model: any) => ({
      name: model.id,
      label: model.id,
      provider: 'LMStudio',
    }));
  } catch (e: any) {
    logger.warn('Failed to get LMStudio models: ', e.message || '');
    return [];
  }
}

async function initializeModelList(providerSettings?: Record<string, IProviderSetting>): Promise<ModelInfo[]> {
  let apiKeys: Record<string, string> = {};

  try {
    const storedApiKeys = Cookies.get('apiKeys');

    if (storedApiKeys) {
      const parsedKeys = JSON.parse(storedApiKeys);

      if (typeof parsedKeys === 'object' && parsedKeys !== null) {
        apiKeys = parsedKeys;
      }
    }
  } catch (error: any) {
    logger.warn(`Failed to fetch apikeys from cookies: ${error?.message}`);
  }
  MODEL_LIST = [
    ...(
      await Promise.all(
        PROVIDER_LIST.filter(
          (p): p is ProviderInfo & { getDynamicModels: () => Promise<ModelInfo[]> } => !!p.getDynamicModels,
        ).map((p) => p.getDynamicModels(apiKeys, providerSettings?.[p.name])),
      )
    ).flat(),
    ...staticModels,
  ];

  return MODEL_LIST;
}

export {
  getOllamaModels,
  getOpenAILikeModels,
  getLMStudioModels,
  initializeModelList,
  getOpenRouterModels,
  PROVIDER_LIST,
};
