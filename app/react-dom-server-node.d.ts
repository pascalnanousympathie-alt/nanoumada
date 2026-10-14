declare module 'react-dom/server.node' {
  import type { ReactNode } from 'react';
  import type { PipeableStream, RenderToPipeableStreamOptions } from 'react-dom/server';

  const reactDomServer: {
    renderToPipeableStream(children: ReactNode, options?: RenderToPipeableStreamOptions): PipeableStream;
  };

  export default reactDomServer;
}
