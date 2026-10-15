export default class SwitchableStream extends TransformStream {
  private _controller: TransformStreamDefaultController | null = null;
  private _currentReader: ReadableStreamDefaultReader | null = null;
  private _switches = 0;
  private _closed = false;
  private _pumpId = 0;

  constructor() {
    let controllerRef: TransformStreamDefaultController | undefined;

    super({
      start(controller) {
        controllerRef = controller;
      },
    });

    if (controllerRef === undefined) {
      throw new Error('Controller not properly initialized');
    }

    this._controller = controllerRef;
  }

  async switchSource(newStream: ReadableStream) {
    if (this._closed) {
      try {
        await newStream.cancel();
      } catch {
        // The destination is already closed; do not restart a cancelled stream.
      }
      return;
    }

    const previousReader = this._currentReader;

    if (previousReader) {
      try {
        await previousReader.cancel();
      } catch {
        // Cancelling an old provider stream is best-effort during a source switch.
      }
    }

    if (this._closed) {
      try {
        await newStream.cancel();
      } catch {
        // The destination closed while the old source was being cancelled.
      }
      return;
    }

    const reader = newStream.getReader();
    this._currentReader = reader;
    const pumpId = ++this._pumpId;

    // Do not await the pump: the response must start streaming immediately.
    void this._pumpStream(reader, pumpId);
    this._switches++;
  }

  private async _pumpStream(reader: ReadableStreamDefaultReader, pumpId: number) {
    const controller = this._controller;

    if (!controller || this._closed) {
      try {
        await reader.cancel();
      } catch {
        // Best-effort cleanup after shutdown.
      }
      return;
    }

    try {
      while (!this._closed && pumpId === this._pumpId) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // A read may resolve after close() or a source switch has invalidated
        // this pump. Never enqueue into a terminated TransformStream controller.
        if (this._closed || pumpId !== this._pumpId) {
          break;
        }

        controller.enqueue(value);
      }
    } catch (error) {
      if (!this._closed && pumpId === this._pumpId) {
        try {
          controller.error(error);
        } catch {
          // The response may have been closed between the check and error().
        }
      }
    } finally {
      if (this._currentReader === reader) {
        this._currentReader = null;
      }

      try {
        reader.releaseLock();
      } catch {
        // A pending read can briefly prevent lock release during cancellation.
      }
    }
  }

  close() {
    if (this._closed) {
      return;
    }

    this._closed = true;
    this._pumpId++;

    const reader = this._currentReader;
    this._currentReader = null;

    if (reader) {
      void reader.cancel().catch(() => {
        // The response is already closing; cancellation is best-effort.
      });
    }

    try {
      this._controller?.terminate();
    } catch {
      // The controller may already have been closed or errored by a prior
      // provider failure. Closing the response must remain idempotent.
    }
  }

  get switches() {
    return this._switches;
  }
}
