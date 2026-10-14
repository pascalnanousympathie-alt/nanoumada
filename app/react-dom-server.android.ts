import { PassThrough, Readable } from 'node:stream';
import type { ReactNode } from 'react';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';

/*
 * React 18 publishes this Node-specific runtime entry, but @types/react-dom
 * only declares the generic "react-dom/server" subpath.
 */
import ReactDOMServer from 'react-dom/server.node';

type AndroidReadableOptions = {
  signal?: AbortSignal;
  onError?: (error: unknown) => void;
};

type ReadableWithAllReady = ReadableStream<Uint8Array> & {
  allReady: Promise<void>;
};

/**
 * Termux/Node development adapter. The production Cloudflare build keeps the
 * original React Web Streams entry; this adapter is injected only in Android
 * Vite dev mode because React 18's Node server entry exposes pipeable streams.
 */
export function renderToReadableStream(
  children: ReactNode,
  options: AndroidReadableOptions = {},
): Promise<ReadableWithAllReady> {
  const output = new PassThrough();
  let resolveAllReady!: () => void;
  const allReady = new Promise<void>((resolve) => {
    resolveAllReady = resolve;
  });

  let resolveShell!: (stream: ReadableWithAllReady) => void;
  let rejectShell!: (error: unknown) => void;
  const shellReady = new Promise<ReadableWithAllReady>((resolve, reject) => {
    resolveShell = resolve;
    rejectShell = reject;
  });
  const webReadable = Object.assign(Readable.toWeb(output) as ReadableStream<Uint8Array>, { allReady });

  const reactOptions: RenderToPipeableStreamOptions = {
    onShellReady() {
      pipeable.pipe(output);
      resolveShell(webReadable);
    },
    onShellError(error) {
      options.onError?.(error);
      resolveAllReady();
      rejectShell(error);
    },
    onAllReady() {
      resolveAllReady();
    },
    onError(error) {
      options.onError?.(error);
    },
  };

  const pipeable = ReactDOMServer.renderToPipeableStream(children, reactOptions);

  const abort = () => pipeable.abort(options.signal?.reason);

  if (options.signal) {
    if (options.signal.aborted) {
      abort();
    } else {
      options.signal.addEventListener('abort', abort, { once: true });
      void allReady.then(() => options.signal?.removeEventListener('abort', abort));
    }
  }

  return shellReady;
}
