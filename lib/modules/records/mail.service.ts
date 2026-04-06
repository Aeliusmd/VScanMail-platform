// ============================================================
// mail.service.ts
// ============================================================
import { mailItemModel } from "@/lib/modules/records/mail.model";
import { storageService } from "../storage/storage.service";
import { aiService } from "../ai/ai.service";
import { auditService } from "../audit/audit.service";
import { billingService } from "../billing/billing.service";
import { notificationService } from "../notifications/notification.service";
import { generateIRN } from "@/lib/modules/records/irn-generator";
import dayjs from "dayjs";

export const mailService = {
  async uploadAndProcess(
    clientId: string,
    operatorId: string,
    type: string,
    frontFile: Buffer,
    backFile: Buffer,
    contentFiles: Buffer[],
    req?: Request
  ) {

    const irn = generateIRN();

    // 1. Upload images to storage
    const frontUrl = await storageService.upload(
      `mail/${irn}/front.png`,
      frontFile
    );
    const backUrl = await storageService.upload(
      `mail/${irn}/back.png`,
      backFile
    );
    const contentUrls = await Promise.all(
      contentFiles.map((f, i) =>
        storageService.upload(`mail/${irn}/page-${i + 1}.png`, f)
      )
    );

    // 2. Tamper detection on envelope
    const frontBase64 = frontFile.toString("base64");
    const backBase64 = backFile.toString("base64");
    const tamperResult = await aiService.detectTampering(
      frontBase64,
      backBase64
    );

    // 3. OCR + AI summary on content pages (if any)
    let ocrText = null;
    let aiSummary = null;
    let aiActions = null;
    let aiRiskLevel = null;

    if (contentFiles.length > 0) {
      // Use GPT-4o Vision for OCR
      const contentBase64 = contentFiles[0].toString("base64");
      const ocrResponse = await aiService.generateSummary(contentBase64);
      aiSummary = ocrResponse.summary;
      aiActions = ocrResponse.actions;
      aiRiskLevel = ocrResponse.risk_level;
    }

    // 4. Create mail item record
    const mailItem = await mailItemModel.create({
      client_id: clientId,
      irn,
      type: type as any,
      envelope_front_url: frontUrl,
      envelope_back_url: backUrl,
      content_scan_urls: contentUrls,
      tamper_detected: tamperResult.tamper_detected,
      tamper_annotations: tamperResult,
      ocr_text: ocrText,
      ai_summary: aiSummary,
      ai_actions: aiActions,
      ai_risk_level: aiRiskLevel,
      retention_until: dayjs().add(90, "day").format("YYYY-MM-DD"),
      scanned_by: operatorId,
      scanned_at: new Date().toISOString(),
      status: "processed",
    }, operatorId, req);

    // 5. Track usage
    await billingService.trackUsage(clientId, "envelope_scan", 1);
    if (aiSummary) {
      await billingService.trackUsage(clientId, "ai_summary", 1);
    }

    // 6. Notify client
    await notificationService.sendNewMailAlert(clientId, mailItem);

    // 7. Audit (Handled by model)

    return mailItem;
  },

  async saveAnnotations(
    mailItemId: string,
    operatorId: string,
    annotations: any,
    tamperDetected: boolean,
    notes?: string,
    req?: Request
  ) {
    const item = await mailItemModel.update(mailItemId, {
      tamper_detected: tamperDetected,
      tamper_annotations: annotations,
    }, operatorId, req);

    // Audit (Handled by model)


    // Alert client if tamper detected
    if (tamperDetected) {
      await notificationService.sendTamperAlert(item.client_id, item);
    }

    return item;
  },
};
