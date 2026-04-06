import { stringSimilarity } from "string-similarity-js";

/**
 * Fuzzy match beneficiary name from cheque against registered client name.
 * Returns score 0-1 and whether it passes the threshold.
 */
export function matchBeneficiary(
  chequePayee: string,
  clientName: string,
  threshold: number = 0.75
): { score: number; match: boolean } {
  const score = stringSimilarity(
    chequePayee.toLowerCase().trim(),
    clientName.toLowerCase().trim()
  );
  return { score: Math.round(score * 100) / 100, match: score >= threshold };
}
