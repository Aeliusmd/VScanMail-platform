import { nanoid } from "nanoid";

/**
 * Generate unique client code.
 * Format: VSM-XXXXX (e.g., VSM-A3K9X)
 */
export function generateClientCode(): string {
  const code = nanoid(5).toUpperCase();
  return `VSM-${code}`;
}
