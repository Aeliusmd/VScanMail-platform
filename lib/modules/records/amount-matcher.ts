import wordsToNumbers from "words-to-numbers";

/**
 * Compare cheque amount in words vs figures.
 * Returns { match: boolean, wordsAmount: number, figuresAmount: number }
 */
export function matchAmounts(
  amountWords: string,
  amountFigures: number
): { match: boolean; wordsAmount: number | null; figuresAmount: number } {
  try {
    const parsed = wordsToNumbers(amountWords.toLowerCase());
    const wordsAmount =
      typeof parsed === "number" ? parsed : parseFloat(String(parsed));

    if (isNaN(wordsAmount)) {
      return { match: false, wordsAmount: null, figuresAmount: amountFigures };
    }

    // Allow $0.01 tolerance for rounding
    const match = Math.abs(wordsAmount - amountFigures) < 0.01;
    return { match, wordsAmount, figuresAmount: amountFigures };
  } catch {
    return { match: false, wordsAmount: null, figuresAmount: amountFigures };
  }
}
