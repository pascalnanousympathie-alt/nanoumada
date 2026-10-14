import { describe, expect, it } from 'vitest';
import { isExplicitlyFreeModel, isExplicitZeroPrice } from './free-provider-utils';

describe('free provider catalog filtering', () => {
  it('accepts numeric and string zero prices', () => {
    expect(isExplicitlyFreeModel(0, '0')).toBe(true);
  });

  it('rejects a model if either input or output has a price', () => {
    expect(isExplicitlyFreeModel(0, '0.000001')).toBe(false);
    expect(isExplicitlyFreeModel('0.1', 0)).toBe(false);
  });

  it('does not treat missing, null, or empty pricing as free', () => {
    expect(isExplicitlyFreeModel(null, 0)).toBe(false);
    expect(isExplicitlyFreeModel(undefined, 0)).toBe(false);
    expect(isExplicitlyFreeModel('', '0')).toBe(false);
  });

  it('recognizes explicit zero without accepting invalid numbers', () => {
    expect(isExplicitZeroPrice('0')).toBe(true);
    expect(isExplicitZeroPrice('not-a-price')).toBe(false);
  });
});
