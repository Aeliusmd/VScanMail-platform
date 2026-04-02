import { chequeModel } from "@/lib/modules/records/cheque.model";
import { clientModel } from "@/lib/modules/clients/client.model";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import { aiService } from "../ai/ai.service";
import { auditService } from "../audit/audit.service";
import { billingService } from "../billing/billing.service";
import { notificationService } from "../notifications/notification.service";

export const chequeService = {
  /**
   * Process a cheque: extract fields, run 6-point validation, store results.
   */
  async processAndValidate(mailItemId: string, imageBase64: string) {
    const mailItem = await mailItemModel.findById(mailItemId);
    const client = await clientModel.findById(mailItem.client_id);

    // 1. GPT-4o Vision extraction
    const extracted = await aiService.extractChequeFields(imageBase64);

    // 2. Optional: AWS Textract for signature confidence
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const textractResult = await aiService.analyzeWithTextract(imageBuffer);

    // Override signature check with Textract if available
    if (textractResult.signatureDetected) {
      extracted.signature_present = true;
    }

    // 3. Run 6-point validation
    const validation = await aiService.validateCheque(
      extracted,
      client.company_name
    );

    // 4. Store cheque record
    const cheque = await chequeModel.create({
      mail_item_id: mailItemId,
      amount_figures: extracted.amount_figures,
      amount_words: extracted.amount_words,
      amounts_match: validation.checks.find(
        (c: any) => c.check === "amount_match"
      )?.passed,
      date_on_cheque: extracted.date,
      date_valid: validation.checks.find(
        (c: any) => c.check === "date_accuracy"
      )?.passed,
      beneficiary: extracted.payee_name,
      beneficiary_match_score:
        validation.checks.find((c: any) => c.check === "beneficiary_match")
          ?.confidence || 0,
      signature_present: extracted.signature_present,
      alteration_detected:
        (extracted.alteration_signs || []).length > 0,
      crossing_present: extracted.crossing_present,
      ai_confidence: validation.confidence,
      ai_raw_result: validation,
      client_decision: "pending",
      status: validation.status as any,
    });

    // 5. Track usage
    await billingService.trackUsage(
      client.id,
      "cheque_validation",
      1
    );

    // 6. Notify client
    await notificationService.sendChequeAlert(client.id, cheque, validation);

    return { cheque, validation };
  },

  /**
   * Client approves a cheque for deposit.
   */
  async approve(chequeId: string, userId: string, reason?: string) {
    const cheque = await chequeModel.updateStatus(
      chequeId,
      "approved",
      userId
    );

    await auditService.log({
      actor: userId,
      action: "cheque.approved",
      entity: chequeId,
      details: { reason, amount: cheque.amount_figures },
    });

    await billingService.trackUsage(
      userId, // will resolve to client
      "cheque_approved",
      1
    );

    return cheque;
  },

  /**
   * Client rejects a cheque.
   */
  async reject(chequeId: string, userId: string, reason: string) {
    const cheque = await chequeModel.updateStatus(
      chequeId,
      "rejected",
      userId
    );

    await auditService.log({
      actor: userId,
      action: "cheque.rejected",
      entity: chequeId,
      details: { reason, amount: cheque.amount_figures },
    });

    return cheque;
  },
};
