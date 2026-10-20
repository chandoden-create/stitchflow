import Decimal from 'decimal.js';

// Configure Decimal.js globally for financial precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/**
 * Add two decimal values safely without floating-point errors.
 */
export function decimalAdd(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return new Decimal(a).plus(new Decimal(b));
}

/**
 * Subtract b from a safely.
 */
export function decimalSub(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return new Decimal(a).minus(new Decimal(b));
}

/**
 * Multiply two values safely.
 */
export function decimalMul(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return new Decimal(a).times(new Decimal(b));
}

/**
 * Sum an array of Decimal/string/number values.
 */
export function decimalSum(values: Array<Decimal | string | number>): Decimal {
  return values.reduce<Decimal>(
    (acc, val) => acc.plus(new Decimal(val)),
    new Decimal(0),
  );
}

/**
 * Convert to a string representation suitable for Prisma Decimal fields.
 * Always returns exactly 2 decimal places.
 */
export function toDecimalString(value: Decimal | string | number): string {
  return new Decimal(value).toFixed(2);
}

/**
 * Check if value is >= 0.
 */
export function isNonNegative(value: Decimal | string | number): boolean {
  return new Decimal(value).gte(0);
}

/**
 * Compare two decimal values.
 * Returns -1, 0, or 1.
 */
export function decimalCompare(
  a: Decimal | string | number,
  b: Decimal | string | number,
): -1 | 0 | 1 {
  const result = new Decimal(a).comparedTo(new Decimal(b));
  if (result < 0) return -1;
  if (result > 0) return 1;
  return 0;
}
