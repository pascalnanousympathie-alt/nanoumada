import { describe, expect, it } from 'vitest';
import { loader } from '../app/routes/api.chat';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

function loaderArgs(method: string): LoaderFunctionArgs {
  return {
    request: new Request('https://nanoumada.example/api/chat', { method }),
    params: {},
    context: {},
  } as LoaderFunctionArgs;
}

describe('chat API unsupported methods', () => {
  it('handles OPTIONS without throwing a Remix routing error', async () => {
    const response = await loader(loaderArgs('OPTIONS'));

    expect(response.status).toBe(204);
    expect(response.headers.get('Allow')).toBe('POST, OPTIONS');
  });

  it('rejects GET with 405 and advertises supported methods', async () => {
    const response = await loader(loaderArgs('GET'));

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST, OPTIONS');
    expect(await response.text()).toBe('Method Not Allowed');
  });
});
