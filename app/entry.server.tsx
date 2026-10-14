import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToReadableStream, renderToString } from 'react-dom/server';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';
import { initializeModelList } from '~/utils/constants';

const isVercelRuntime = typeof process !== 'undefined' && Boolean(process.env?.VERCEL);

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  await initializeModelList();

  // Vercel's Node runtime has repeatedly aborted React 18's browser Web Stream
  // renderer during response cancellation (ERR_INVALID_STATE: Controller is already
  // closed). Produce a complete document on Vercel to avoid that close race.
  // Keep streaming SSR on Cloudflare and local runtimes.
  if (isVercelRuntime) {
    const head = renderHeadToString({ request, remixContext, Head });
    const appMarkup = renderToString(<RemixServer context={remixContext} url={request.url} />);

    responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
    responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
    responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

    return new Response(
      `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">${appMarkup}</div></body></html>`,
      { headers: responseHeaders, status: responseStatusCode },
    );
  }

  const readable = await renderToReadableStream(<RemixServer context={remixContext} url={request.url} />, {
    // Vercel owns the outer response cancellation lifecycle. Passing its disconnect signal
    // into React 18's Web Streams renderer can race its internal stream-close handler.
    signal: isVercelRuntime ? undefined : request.signal,
    onError(error: unknown) {
      console.error(error);
      responseStatusCode = 500;
    },
  });

  let responseCancelled = false;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  const body = new ReadableStream({
    start(controller) {
      const head = renderHeadToString({ request, remixContext, Head });

      controller.enqueue(
        new Uint8Array(
          new TextEncoder().encode(
            `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`,
          ),
        ),
      );

      reader = readable.getReader();

      function read() {
        reader!
          .read()
          .then(({ done, value }) => {
            if (done) {
              if (!responseCancelled) {
                controller.enqueue(new Uint8Array(new TextEncoder().encode('</div></body></html>')));
                controller.close();
              }

              try {
                reader?.releaseLock();
              } catch {
                // The outer response may have been cancelled while the final read settled.
              }

              return;
            }

            // On Vercel, continue draining the React stream after a client disconnect instead
            // of cancelling it a second time. React 18's browser renderer can otherwise try
            // to close an already-closed Web Streams controller during abort handling.
            if (!responseCancelled) {
              controller.enqueue(value);
            }

            read();
          })
          .catch((error) => {
            if (!responseCancelled) {
              controller.error(error);
            }

            try {
              reader?.releaseLock();
            } catch {
              // Ignore a release attempt if a pending read still owns the lock.
            }
          });
      }

      read();
    },

    cancel() {
      responseCancelled = true;

      if (!isVercelRuntime) {
        // Cloudflare's request.signal still coordinates cancellation with the renderer.
        // Avoid calling ReadableStream.cancel() on a stream that is locked by a reader.
        return reader?.cancel().catch(() => undefined);
      }

      // Vercel: let the inner React stream finish and discard any remaining chunks.
      // This avoids duplicate cancellation/close races in React 18's Web Streams renderer.
    },
  });

  // Avoid React 18 Web Stream abort/close races on Vercel. The outer Vercel
  // response owns cancellation, so finish the inner SSR render before sending
  // any bytes; other runtimes can keep streaming for normal browser requests.
  if (isVercelRuntime || isbot(request.headers.get('user-agent') || '')) {
    await readable.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
