import { openai } from "@/lib/modules/ai/openai.config";
import { matchAmounts } from "@/lib/modules/records/amount-matcher";
import { matchBeneficiary } from "@/lib/modules/records/fuzzy-match";
import { stringSimilarity } from "string-similarity-js";
import dayjs from "dayjs";

/**
 * Accepts a full data URL (data:image/jpeg;base64,...) or a raw base64 string.
 * Returns a properly formed data URL that OpenAI Vision can accept.
 */
function normalizeImageUrl(input: string): string {
  if (!input) return input;
  // Already a well-formed data URL — return as-is
  if (input.startsWith("data:")) return input;
  // Raw base64 string (no prefix) — default to jpeg which is most common for uploads
  return `data:image/jpeg;base64,${input}`;
}

export const aiService = {
  /**
   * Detect if a scanned document is a cheque or a standard letter.
   */
  async detectDocumentType(contentBase64: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 100,
      messages: [
        {
          role: "system",
           content: "You are a document classifier. Determine if the document is a 'cheque' or a 'letter'. Return ONLY valid JSON in the format: { \"type\": \"cheque\" | \"letter\" }",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Classify this document:",
            },
            {
              type: "image_url",
              image_url: { url: normalizeImageUrl(contentBase64) },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content || "{}";
    try {
      const data = JSON.parse(text);
      return (data.type || data.document_type || "letter") as "cheque" | "letter";
    } catch {
      return "letter";
    }
  },

  /**
   * Identifies the most likely client based on extracted document text.
   */
  async identifyClient(documentText: string, clients: any[]) {
    if (!documentText || !clients.length) return null;

    // 1. Try fuzzy matching against client names
    let bestMatch = null;
    let maxScore = 0;

    for (const client of clients) {
      const score = stringSimilarity(
        documentText.toLowerCase(),
        client.company_name.toLowerCase()
      );
      if (score > maxScore) {
        maxScore = score;
        bestMatch = client;
      }
    }

    // If we have a very strong match (> 0.85), return it immediately
    if (maxScore > 0.85) return bestMatch;

    // 2. If ambiguous, ask AI to decide from the provided list
    const clientOptions = clients.map(c => ({ id: c.id, name: c.company_name }));
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: "You are an entity matcher. Identify which client from the provided list is mentioned in the text as the recipient. Return ONLY valid JSON with 'clientId' or null.",
        },
        {
          role: "user",
          content: `List of Clients: ${JSON.stringify(clientOptions)}\n\nExtracted Text: ${documentText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiData = JSON.parse(response.choices[0]?.message?.content || "{}");
    if (aiData.clientId) {
      return clients.find(c => c.id === aiData.clientId) || bestMatch;
    }

    return bestMatch;
  },

  /**
   * Extract all fields from a cheque image using GPT-4o Vision.
   */
  async extractChequeFields(imageBase64: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content:
            "You are a financial document analyst. Extract cheque fields accurately according to the 6-point validation spec. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this cheque image and extract:
{
  "date": "YYYY-MM-DD or null",
  "payee_name": "string",
  "amount_figures": number,
  "amount_words": "string",
  "signature_present": true/false,
  "crossing_present": true/false,
  "alteration_signs": ["list of issues or empty array"],
  "micr_line": "string or null",
  "bank_name": "string or null",
  "cheque_number": "string or null",
  "overall_condition": "clean|worn|damaged"
}`,
            },
            {
              type: "image_url",
              image_url: { url: normalizeImageUrl(imageBase64) },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text);
  },

  /**
   * Run the 6-point validation on extracted cheque data.
   */
  async validateCheque(
    extracted: any,
    clientName: string
  ) {
    const checks = [];

    // Check 1: Date accuracy
    let dateValid = false;
    let dateIssue = null;
    if (extracted.date) {
      const chequeDate = dayjs(extracted.date);
      const today = dayjs();
      const stale = chequeDate.isBefore(today.subtract(180, "day"));
      const postDated = chequeDate.isAfter(today);
      dateValid = !stale && !postDated;
      if (stale) dateIssue = "stale_dated";
      if (postDated) dateIssue = "post_dated";
    }
    checks.push({
      check: "date_accuracy",
      passed: dateValid,
      issue: dateIssue,
    });

    // Check 2: Beneficiary match
    const beneficiary = matchBeneficiary(
      extracted.payee_name || "",
      clientName
    );
    checks.push({
      check: "beneficiary_match",
      passed: beneficiary.match,
      confidence: beneficiary.score,
    });

    // Check 3: Words vs Figures (CAR vs LAR)
    const amounts = matchAmounts(
      extracted.amount_words || "",
      extracted.amount_figures || 0
    );
    checks.push({
      check: "amount_match",
      passed: amounts.match,
      wordsAmount: amounts.wordsAmount,
      figuresAmount: amounts.figuresAmount,
    });

    // Check 4: Signature presence (GPT-4o exclusive)
    checks.push({
      check: "signature_present",
      passed: extracted.signature_present === true,
    });

    // Check 5: Crossing (Parallel lines)
    checks.push({
      check: "crossing_present",
      passed: true, // Informational only
      value: extracted.crossing_present,
    });

    // Check 6: Alteration detection
    const alterations = extracted.alteration_signs || [];
    checks.push({
      check: "alteration_detection",
      passed: alterations.length === 0,
      issues: alterations,
    });

    // Overall
    const passedCount = checks.filter((c) => c.passed).length;
    const confidence = Math.round((passedCount / checks.length) * 100) / 100;
    const allPassed = checks.every((c) => c.passed);

    return {
      status: allPassed ? "validated" : "flagged",
      confidence,
      checks,
      extracted,
    };
  },

  /**
   * Detect tampering on envelope images using GPT-4o Vision.
   */
  async detectTampering(frontBase64: string, backBase64: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content:
            "You are a mail security analyst. Analyze envelope images for tampering. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these envelope images (front and back) for tampering signs:
1. Torn or damaged flap/seal
2. Signs of resealing (glue residue, wrinkles at seal)
3. Tape or adhesive marks
4. Water damage or staining
5. Unusual creasing or pressure marks
6. Evidence of steaming open

Return:
{
  "tamper_detected": true,
  "confidence": 0.0-1.0,
  "findings": [{"type": "string", "confidence": 0.0-1.0, "location": "string", "description": "string"}],
  "risk_level": "none|low|medium|high",
  "recommendation": "string"
}`,
            },
            {
              type: "image_url",
              image_url: { url: normalizeImageUrl(frontBase64) },
            },
            {
              type: "image_url",
              image_url: { url: normalizeImageUrl(backBase64) },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text);
  },

  /**
   * Generate AI executive summary of mail content from an image.
   */
  async generateSummaryFromImage(contentBase64: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content:
            "You are a business mail analyst. Analyze mail content from an image and provide structured intelligence. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this mail content image and return:
{
  "summary": "2-3 sentence executive summary",
  "actions": [{"action": "string", "deadline": "YYYY-MM-DD or null", "priority": "low|medium|high"}],
  "risk_level": "low|medium|high|critical",
  "category": "legal|financial|marketing|administrative|personal|other",
  "key_entities": ["names, companies, or references mentioned"],
  "ocr_text": "the full extracted text from the image"
}`,
            },
            {
              type: "image_url",
              image_url: { url: normalizeImageUrl(contentBase64) },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text);
  },
};
