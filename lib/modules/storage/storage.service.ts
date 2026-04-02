import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-1";
const bucket = process.env.S3_SCANS_BUCKET || "vscanmail-scans";

const s3 = new S3Client({ region });

export const storageService = {
  async upload(path: string, buffer: Buffer, contentType = "image/png") {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const publicBase = process.env.S3_PUBLIC_BASE_URL;
    if (publicBase) {
      return `${publicBase.replace(/\/$/, "")}/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
    }

    // Default: return a signed URL for viewing (short-lived).
    return await this.getSignedUrl(path, 3600);
  },

  async getSignedUrl(path: string, expiresIn = 3600) {
    return await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: path,
      }),
      { expiresIn }
    );
  },

  async delete(path: string) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: path,
      })
    );
  },
};

