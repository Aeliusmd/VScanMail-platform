import { nanoid } from "nanoid";
import dayjs from "dayjs";

/**
 * Generate Internal Reference Number.
 * Format: IRN-YYYYMMDD-XXXX (e.g., IRN-20260319-A3K9)
 */
export function generateIRN(): string {
  const date = dayjs().format("YYYYMMDD");
  const suffix = nanoid(4).toUpperCase();
  return `IRN-${date}-${suffix}`;
}
