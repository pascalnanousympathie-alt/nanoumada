import { describe, expect, it } from 'vitest';
import SwitchableStream from './switchable-stream';

describe('SwitchableStream', () => {
  it('forwards provider chunks and can then close cleanly', async () => {
    const stream = new SwitchableStream();
    const outputReader = stream.readable.getReader();
    const encoder = new TextEncoder();

    await stream.switchSource(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('hello'));
          controller.close();
        },
      }),
    );

    const first = await outputReader.read();

    expect(first.done).toBe(false);
    expect(new TextDecoder().decode(first.value)).toBe('hello');

    stream.close();

    const end = await outputReader.read();
    expect(end.done).toBe(true);
    outputReader.releaseLock();
  });

  it('allows close to be called repeatedly while a provider read is pending', async () => {
    const stream = new SwitchableStream();
    const outputReader = stream.readable.getReader();

    await stream.switchSource(
      new ReadableStream<Uint8Array>({
        // Keep the source open so the pump is waiting on read() when close runs.
        start() {},
      }),
    );

    expect(() => stream.close()).not.toThrow();
    expect(() => stream.close()).not.toThrow();

    const end = await outputReader.read();
    expect(end.done).toBe(true);
    outputReader.releaseLock();
  });

  it('does not accept a new provider source after closing', async () => {
    const stream = new SwitchableStream();
    const outputReader = stream.readable.getReader();
    stream.close();

    await stream.switchSource(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('late'));
          controller.close();
        },
      }),
    );

    const end = await outputReader.read();
    expect(end.done).toBe(true);
    outputReader.releaseLock();
  });
});
