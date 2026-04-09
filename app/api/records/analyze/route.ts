import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { aiService } from "@/lib/modules/ai/ai.service";
import { clientModel } from "@/lib/modules/clients/client.model";
import { storageService } from "@/lib/modules/storage/storage.service";

export async function POST(req: NextRequest) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin", "super_admin"]);

    const body = await req.json();
    const { front, back, content, isSkipped, manualDocType } = body;

    if (!front || !back) {
      return NextResponse.json({ error: "Envelope scans are required" }, { status: 400 });
    }

    // 1. Detect Tampering (Using GPT-4o Vision exclusively)
    const tampering = await aiService.detectTampering(front, back);

    let docType: "letter" | "cheque" = manualDocType || "letter";
    let aiResults: any = {};
    let ocrTextForIdentification = "";
    
    // Helper to upload base64 to storage
    const uploadBase64 = async (base64: string, name: string) => {
      // 1. Split data URI from raw base64
      let dataUriPart = "data:image/jpeg;base64";
      let rawBase64 = base64;
      const commaIdx = base64.indexOf(',');
      
      if (commaIdx > -1) {
        dataUriPart = base64.slice(0, commaIdx);
        rawBase64 = base64.slice(commaIdx + 1);
      }

      // 2. Extract MIME type (e.g. "data:image/png;base64" -> "image/png")
      let mimeType = "image/jpeg";
      const mimeMatch = dataUriPart.match(/data:([^;]+);base64/);
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1];
      }

      const allowedMimes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
      let buffer: Buffer = Buffer.from(rawBase64, "base64");

      // 3. If MIME type is not allowed (e.g., image/heic, pdf, etc.), try to convert it to PNG
      if (!allowedMimes.includes(mimeType)) {
        try {
          const sharp = (await import("sharp")).default;
          buffer = await sharp(buffer).png().toBuffer();
          mimeType = "image/png";
        } catch (convertErr) {
          console.error("Format conversion failed for", mimeType, convertErr);
          throw new Error(`Unsupported image format: ${mimeType}`);
        }
      }

      const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
      const filePath = `scans/${user.id}/${Date.now()}-${name}.${ext}`;
      return await storageService.upload(filePath, buffer, mimeType);
    };

    // Upload front and back images with error handling
    let frontUrl: string, backUrl: string;
    try {
      frontUrl = await uploadBase64(front, "env-front");
      backUrl = await uploadBase64(back, "env-back");
    } catch (e) {
      console.error('Upload error (front/back):', e);
      return NextResponse.json({ error: 'Failed to upload envelope images.' }, { status: 500 });
    }
    let contentUrl = null;
    if (!isSkipped && content) {
      try {
        contentUrl = await uploadBase64(content, "content");
      } catch (e) {
        console.error('Upload error (content):', e);
        return NextResponse.json({ error: 'Failed to upload content image.' }, { status: 500 });
      }

      // 2. Detect Document Type (Only if not manually specified)
      if (!manualDocType) {
        docType = await aiService.detectDocumentType(content);
      }

      if (docType === "cheque") {
        aiResults = await aiService.extractChequeFields(content);
        ocrTextForIdentification = `${aiResults.payee_name || ""} ${aiResults.bank_name || ""}`;
      } else {
        aiResults = await aiService.generateSummaryFromImage(content);
        ocrTextForIdentification = aiResults.ocr_text || "";
      }
    }

    // 3. Identify likely client
    const { clients: allClients } = await clientModel.list(1, 1000);
    const suggestedClient = await aiService.identifyClient(ocrTextForIdentification, allClients);

    // 4. If cheque, perform validation against suggested client (if any)
    if (docType === "cheque" && suggestedClient) {
      const validation = await aiService.validateCheque(aiResults, suggestedClient.company_name);
      aiResults = { ...aiResults, validation };
    }

    return NextResponse.json({
      success: true,
      data: {
        docType,
        tampering,
        aiResults,
        ocrText: ocrTextForIdentification,
        urls: {
          front: frontUrl,
          back: backUrl,
          content: contentUrl
        },
        suggestedClient: suggestedClient ? {
          id: suggestedClient.id,
          name: suggestedClient.company_name,
          email: suggestedClient.email
        } : null
      }
    });

  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
