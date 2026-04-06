import { nanoid } from "nanoid";

/**
 * Generate unique client code.
 * Format: VSM-XXXXX (e.g., VSM-A3K9X)
 */
export function generateClientCode(): string {
  const code = nanoid(5).toUpperCase();
  return `VSM-${code}`;
}

/**
 * Generate the table name for the client's records.
 * e.g., org_vsmxxxxx_records
 */
export function generateClientTableName(clientCode: string): string {
  const sanitizedCode = clientCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `org_${sanitizedCode}_records`;
}
