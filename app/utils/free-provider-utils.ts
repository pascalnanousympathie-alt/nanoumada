type PriceValue = number | string | null | undefined;

/**
 * True only when the provider explicitly reports a numeric zero price.
 * Missing/null prices must never be treated as free.
 */
export function isExplicitZeroPrice(value: PriceValue): boolean {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return false;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed === 0;
}

export function isExplicitlyFreeModel(inputPrice: PriceValue, outputPrice: PriceValue): boolean {
  return isExplicitZeroPrice(inputPrice) && isExplicitZeroPrice(outputPrice);
}
