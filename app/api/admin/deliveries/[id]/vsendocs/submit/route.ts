import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withRole } from "@/lib/modules/auth/auth.middleware";
import { db, sql } from "@/lib/modules/core/db/mysql";
import { ensureClientTableDeliveryColumns } from "@/lib/modules/core/db/dynamic-table";
import { deliveryModel } from "@/lib/modules/records/delivery.model";
import { VSendDocsError, vSendDocsClient } from "@/lib/modules/vsendocs/vsendocs.client";

const bodySchema = z.object({
  fileContent: z.string().min(1),
  fileName: z.string().min(1),
  postType: z
    .enum(["Standard", "Do not include POS", "EAMS POS", "Detailed POS"])
    .default("Standard"),
  expressDelivery: z.boolean().optional(),
  duplexPrint: z.boolean().optional(),
  addressName: z.string().optional(),
  addressLine1Override: z.string().optional(),
  addressLine2Override: z.string().optional(),
  addressCityOverride: z.string().optional(),
  addressStateOverride: z.string().optional(),
  addressZipOverride: z.string().optional(),
});

function stripDataUrlBase64(input: string): string {
  const s = String(input || "");
  const idx = s.indexOf("base64,");
  if (idx >= 0) return s.slice(idx + "base64,".length);
  return s;
}

function wrapImageInPdf(base64Image: string, _mimeType: string): string {
  // Minimal valid PDF wrapping a JPEG/PNG as an XObject image.
  // Returns pure base64 of the resulting PDF.
  const imgBytes = Buffer.from(base64Image, "base64");
  const w = 595,
    h = 842; // A4 points

  const imgObj = `1 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`;
  const imgObjEnd = `\nendstream\nendobj\n`;

  const pageContent = `q ${w} 0 0 ${h} 0 0 cm /Im1 Do Q`;
  const contentStream = `2 0 obj\n<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream\nendobj\n`;
  const pageObj = `3 0 obj\n<< /Type /Page /Parent 4 0 R /MediaBox [0 0 ${w} ${h}] /Contents 2 0 R /Resources << /XObject << /Im1 1 0 R >> >> >>\nendobj\n`;
  const pagesObj = `4 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const catalogObj = `5 0 obj\n<< /Type /Catalog /Pages 4 0 R >>\nendobj\n`;

  // Build sequentially with proper byte offsets for xref
  const parts: Buffer[] = [];
  parts.push(Buffer.from(`%PDF-1.4\n`));
  const offsets: number[] = [];
  let pos = parts[0].length;

  const appendObj = (s: string, extra?: Buffer) => {
    offsets.push(pos);
    const b = Buffer.from(s);
    parts.push(b);
    pos += b.length;
    if (extra) {
      parts.push(extra);
      pos += extra.length;
    }
  };

  appendObj(imgObj, imgBytes);
  parts.push(Buffer.from(imgObjEnd));
  pos += imgObjEnd.length;
  appendObj(contentStream);
  appendObj(pageObj);
  appendObj(pagesObj);
  appendObj(catalogObj);

  const xrefPos = pos;
  const xref = `xref\n0 6\n0000000000 65535 f \n${offsets
    .map((o) => String(o).padStart(10, "0") + " 00000 n ")
    .join("\n")}\n`;
  const trailer = `trailer\n<< /Size 6 /Root 5 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  parts.push(Buffer.from(xref + trailer));

  return Buffer.concat(parts).toString("base64");
}

function escapeIdent(ident: string) {
  return `\`${String(ident).replace(/`/g, "``")}\``;
}

function escapeSql(value: string | null | undefined): string {
  return String(value ?? "").replace(/'/g, "''");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(req);
    withRole(user, ["admin"]);

    const { id } = await params;
    const body = bodySchema.parse(await req.json());

    const recordRow = await deliveryModel.findRecordRowById(id);
    if (!recordRow) {
      return NextResponse.json({ error: "Delivery record not found" }, { status: 400 });
    }

    const tableName = String(recordRow._table_name || "");
    if (!tableName) {
      return NextResponse.json({ error: "Delivery table not found" }, { status: 400 });
    }

    await ensureClientTableDeliveryColumns(tableName);

    const deliveryCountry = String(recordRow.delivery_address_country || "")
      .trim()
      .toUpperCase();
    if (deliveryCountry && deliveryCountry !== "US") {
      return NextResponse.json(
        {
          error:
            "USPS/vSendDocs requires a US mailing address. Delivery country must be US — update the delivery address on this record or override with US-format fields before submitting.",
        },
        { status: 400 }
      );
    }

    const partyName = String(body.addressName || recordRow.delivery_address_name || "").trim() || "Recipient";
    const addressLine1 = String(body.addressLine1Override || recordRow.delivery_address_line1 || "").trim();
    const city = String(body.addressCityOverride || recordRow.delivery_address_city || "").trim();
    const state = String(body.addressStateOverride || recordRow.delivery_address_state || "")
      .trim()
      .toUpperCase();
    const zipCode = String(body.addressZipOverride || recordRow.delivery_address_zip || "").trim();
    const addressLine2 =
      body.addressLine2Override ??
      (recordRow.delivery_address_line2 ? String(recordRow.delivery_address_line2) : undefined);

    if (!/^[A-Za-z]{2}$/.test(state)) {
      return NextResponse.json(
        {
          error:
            "addressState must be a 2-letter US state code (USPS). vSendDocs validates addresses against USPS — correct state before submitting.",
        },
        { status: 400 }
      );
    }
    if (!/^[0-9]{5}(-[0-9]{4})?$/.test(zipCode)) {
      return NextResponse.json(
        {
          error:
            "addressZip must be 5 digits or ZIP+4 (USPS format, e.g. 12345 or 12345-6789). vSendDocs requires a USPS-valid ZIP.",
        },
        { status: 400 }
      );
    }

    if (!addressLine1) {
      return NextResponse.json({ error: "addressLine1 is required" }, { status: 400 });
    }
    if (!city) {
      return NextResponse.json({ error: "addressCity is required" }, { status: 400 });
    }

    const isImage = /\.(jpe?g|png)$/i.test(body.fileName);
    const pureBase64 = isImage
      ? wrapImageInPdf(stripDataUrlBase64(body.fileContent), body.fileName)
      : stripDataUrlBase64(body.fileContent);
    const pdfFileName = isImage ? body.fileName.replace(/\.(jpe?g|png)$/i, ".pdf") : body.fileName;

    const submitRes = await vSendDocsClient.submitForDelivery({
      postType: body.postType,
      duplexPrint: Boolean(body.duplexPrint),
      expressDelivery: Boolean(body.expressDelivery),
      attachments: [{ fileName: pdfFileName, fileContent: pureBase64 }],
      parties: [
        {
          name: partyName,
          phoneNumber: recordRow.delivery_address_phone
            ? String(recordRow.delivery_address_phone)
            : undefined,
          addressLine1,
          addressLine2,
          city,
          state,
          zipCode,
        },
      ],
    });

    await db.execute(
      sql.raw(
        `UPDATE ${escapeIdent(tableName)}
         SET delivery_vsendocs_submission_id = '${escapeSql(submitRes.submissionId)}',
             delivery_vsendocs_submission_number = '${escapeSql(submitRes.submissionNumber)}'
         WHERE id = '${escapeSql(id)}'`
      )
    );

    return NextResponse.json(submitRes);
  } catch (error: any) {
    if (
      error instanceof VSendDocsError &&
      error.status === 400 &&
      Array.isArray(error.payload?.errors)
    ) {
      return NextResponse.json(
        { error: error.message, suggestions: error.payload?.errors ?? null },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

