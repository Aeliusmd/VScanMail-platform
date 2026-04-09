import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { mailItemModel } from "@/lib/modules/records/mail.model";
import dayjs from "dayjs";

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);

    const body = await req.json();
    console.log("Finalize request body:", JSON.stringify(body, null, 2));

    const { 
      clientId, 
      docType, 
      urls, 
      tampering, 
      aiResults, 
      ocrText 
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    if (!docType) {
      console.error("Missing docType in finalize request:", body);
      return NextResponse.json({ error: "Document type is required (docType missing)" }, { status: 400 });
    }

    // Create Official Record in the dynamic client table
    const record = await mailItemModel.create({
      client_id: clientId,
      irn: `IRN-${Date.now()}`,
      type: docType,
      envelope_front_url: urls.front,
      envelope_back_url: urls.back,
      content_scan_urls: urls.content ? [urls.content] : [],
      tamper_detected: tampering.tamper_detected,
      tamper_annotations: tampering,
      ocr_text: ocrText || "",
      ai_summary: aiResults.summary || (docType === 'cheque' ? `Cheque processing for ${aiResults.payee_name || 'unknown'}` : ""),
      ai_actions: aiResults.actions || [],
      ai_risk_level: aiResults.risk_level || (tampering.risk_level as any) || "low",
      scanned_by: user.id,
      scanned_at: new Date().toISOString(),
      status: "scanned",
      retention_until: dayjs().add(30, 'day').toISOString(),

      // Cheque specific mapping
      ...(docType === 'cheque' ? {
        cheque_amount_figures: aiResults.amount_figures,
        cheque_amount_words: aiResults.amount_words,
        cheque_amounts_match: aiResults.validation?.checks?.find((c: any) => c.check === 'amount_match')?.passed,
        cheque_date_on_cheque: aiResults.date,
        cheque_date_valid: aiResults.validation?.checks?.find((c: any) => c.check === 'date_accuracy')?.passed,
        cheque_beneficiary: aiResults.payee_name,
        cheque_beneficiary_match: aiResults.validation?.checks?.find((c: any) => c.check === 'beneficiary_match')?.confidence,
        cheque_signature_present: aiResults.signature_present,
        cheque_alteration_detected: aiResults.validation?.checks?.find((c: any) => c.check === 'alteration_detection')?.passed === false,
        cheque_crossing_present: aiResults.crossing_present,
        cheque_ai_confidence: aiResults.validation?.confidence,
        cheque_ai_raw_result: aiResults,
        cheque_status: aiResults.validation?.status || 'validated'
      } : {})
    }, user.id, req);

    return NextResponse.json({ 
      success: true, 
      recordId: record.id 
    });

  } catch (error: any) {
    console.error("Finalization error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
