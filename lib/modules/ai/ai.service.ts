import { openai } from "@/lib/modules/ai/openai.config";
import { textract } from "@/lib/modules/storage/aws.config";
import { AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import { matchAmounts } from "@/lib/modules/records/amount-matcher";
import { matchBeneficiary } from "@/lib/modules/records/fuzzy-match";
import dayjs from "dayjs";

export const aiService = {
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
            "You are a financial document analyst. Extract cheque fields accurately. Return ONLY valid JSON, no markdown.",
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
              image_url: { url: `data:image/png;base64,${imageBase64}` },
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
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

    // Check 4: Signature presence
    checks.push({
      check: "signature_present",
      passed: extracted.signature_present === true,
    });

    // Check 5: Crossing
    checks.push({
      check: "crossing_present",
      passed: true, // informational only — not a fail condition
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
  "tamper_detected": true/false,
  "confidence": 0.0-1.0,
  "findings": [{"type": "string", "confidence": 0.0-1.0, "location": "string", "description": "string"}],
  "risk_level": "none|low|medium|high",
  "recommendation": "string"
}`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${frontBase64}` },
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${backBase64}` },
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  },

  /**
   * Generate AI executive summary of mail content.
   */
  async generateSummary(ocrText: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content:
            "You are a business mail analyst. Analyze mail content and provide structured intelligence. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `Analyze this mail content and return:
{
  "summary": "2-3 sentence executive summary",
  "actions": [{"action": "string", "deadline": "YYYY-MM-DD or null", "priority": "low|medium|high"}],
  "risk_level": "low|medium|high|critical",
  "category": "legal|financial|marketing|administrative|personal|other",
  "key_entities": ["names, companies, or references mentioned"]
}

Mail content:
${ocrText}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  },

  /**
   * Use AWS Textract for signature detection and document analysis.
   */
  async analyzeWithTextract(imageBuffer: Buffer) {
    const command = new AnalyzeDocumentCommand({
      Document: { Bytes: imageBuffer },
      FeatureTypes: ["SIGNATURES", "FORMS", "TABLES"],
    });

    const result = await textract.send(command);

    const signatures =
      result.Blocks?.filter((b) => b.BlockType === "SIGNATURE") || [];

    return {
      signatureDetected: signatures.length > 0,
      signatureCount: signatures.length,
      signatureConfidence: signatures[0]?.Confidence || 0,
      blocks: result.Blocks,
    };
  },
};
