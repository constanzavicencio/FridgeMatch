/**
 * Convert a decimal number to a fraction string representation
 * Examples: 0.5 → "1/2", 1.25 → "1 1/4", 2 → "2"
 */
export function decimalToFraction(decimal: number): string {
  // Handle integers
  if (Number.isInteger(decimal)) {
    return decimal.toString();
  }

  const tolerance = 1e-6;
  const maxDenominator = 8; // Only use 1/2, 1/4, 1/8, etc.

  // Split into integer and decimal parts
  const integerPart = Math.floor(decimal);
  const decimalPart = decimal - integerPart;

  // Find the best fraction approximation for the decimal part
  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestError = tolerance;

  for (let denominator = 1; denominator <= maxDenominator; denominator++) {
    for (let numerator = 1; numerator < denominator; numerator++) {
      const fraction = numerator / denominator;
      const error = Math.abs(fraction - decimalPart);

      if (error < bestError) {
        bestError = error;
        bestNumerator = numerator;
        bestDenominator = denominator;
      }
    }
  }

  // If no good approximation found, return decimal
  if (bestError > tolerance) {
    return decimal.toFixed(2);
  }

  // Build the result string
  if (integerPart === 0) {
    return `${bestNumerator}/${bestDenominator}`;
  }

  return `${integerPart} ${bestNumerator}/${bestDenominator}`;
}

/**
 * Format a quantity with its unit, using fractions for non-integers
 * Examples: (0.5, "kg") → "1/2 kg", (2.25, "tazas") → "2 1/4 tazas"
 */
export function formatQuantity(quantity: number, unit: string): string {
  const fractionQty = decimalToFraction(quantity);
  return `${fractionQty} ${unit}`;
}
