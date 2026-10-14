import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import type { IProviderSetting } from '~/types/model';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

function parseCookies(cookieHeader: string) {
  const cookies: any = {};

  // Split the cookie string by semicolons and spaces
  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest) {
      // Decode the name and value, and join value parts in case it contains '='
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const requestBody = await request.json<{
    messages: Messages;
    model?: string;
    apiKeys?: Record<string, string>;
  }>();
  const { messages } = requestBody;

  const runtimeEnv = ((context as any)?.cloudflare?.env ?? process.env) as Env;

  const cookieHeader = request.headers.get('Cookie');

  /*
   * Use current UI state first, with cookies as a fallback for older clients.
   * The API-key UI and Chat client maintain separate React state; without this
   * merge a newly saved key may not reach the model request until a reload.
   */
  const cookies = parseCookies(cookieHeader || '');
  const cookieApiKeys = JSON.parse(cookies.apiKeys || '{}');
  const bodyApiKeys =
    requestBody.apiKeys && typeof requestBody.apiKeys === 'object' && !Array.isArray(requestBody.apiKeys)
      ? requestBody.apiKeys
      : {};
  const apiKeys = { ...cookieApiKeys, ...bodyApiKeys };
  const providerSettings: Record<string, IProviderSetting> = JSON.parse(cookies.providers || '{}');

  const stream = new SwitchableStream();

  try {
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason }) => {
        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        const result = await streamText({ messages, env: runtimeEnv, options, apiKeys, providerSettings });

        return stream.switchSource(result.toAIStream());
      },
    };

    const result = await streamText({ messages, env: runtimeEnv, options, apiKeys, providerSettings });

    stream.switchSource(result.toAIStream());

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error: any) {
    const providerError = String(error?.message ?? error ?? '');
    const safeProviderError = providerError
      .replace(/([?&](?:key|api[_-]?key|access_token|token)=)[^&\\s]+/gi, '$1[REDACTED]')
      .replace(/\\bAIza[0-9A-Za-z_-]{20,}\\b/g, '[REDACTED_API_KEY]')
      .replace(
        /\\b(?:sk-[A-Za-z0-9_-]{16,}|sk_[A-Za-z0-9_-]{16,}|gsk_[A-Za-z0-9_-]{16,}|hf_[A-Za-z0-9_-]{16,}|xai-[A-Za-z0-9_-]{16,}|or-v1-[A-Za-z0-9_-]{16,})\\b/g,
        '[REDACTED_API_KEY]',
      )
      .replace(/\\bBearer\\s+\\S+/gi, 'Bearer [REDACTED]');
    console.error('Chat provider request failed:', safeProviderError.slice(0, 800));

    if (/\b429\b|rate.?limit|quota|resource_exhausted|too many requests/i.test(providerError)) {
      throw new Response(
        'This AI provider has reached a rate or usage quota. Switch to another enabled free/quota provider, choose another model, or wait for the quota reset.',
        { status: 429, statusText: 'Provider quota exceeded' },
      );
    }

    const missingKeyMatch = providerError.match(/API key is missing for ([^.]+)/i);

    if (missingKeyMatch) {
      throw new Response(
        `Nanoumada did not receive an API key for ${missingKeyMatch[1]}. Save the key in the chat API Key control and retry.`,
        { status: 401, statusText: 'API key not received' },
      );
    }

    if (/API key not valid|invalid API key|API_KEY_INVALID|key is not valid/i.test(providerError)) {
      throw new Response(
        'The AI provider rejected the API key. Nanoumada reached the provider, but the key was not accepted. Check that the key is active and Gemini API access is enabled for its Google project.',
        { status: 401, statusText: 'Provider rejected API key' },
      );
    }

    if (error.message?.includes('API key')) {
      throw new Response('The AI provider could not use this API key. Check the key and provider settings.', {
        status: 401,
        statusText: 'API key error',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
