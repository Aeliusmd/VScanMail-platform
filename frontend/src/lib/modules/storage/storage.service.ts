import * as fs from "fs";
import * as path from "path";

// Local disk storage for development.
// All scanned images are saved under: <project-root>/public/uploads/
// They are served at: http://localhost:3010/uploads/<path>
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const BASE_URL = process.env.STORAGE_BASE_URL || "http://localhost:3010/uploads";

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const storageService = {
  /**
   * Save a buffer to the local disk and return its public URL.
   * Path example: "scans/client123/1700000000-envelope-front.png"
   */
  async upload(filePath: string, buffer: Buffer, _contentType = "image/jpeg") {
    const fullPath = path.join(UPLOADS_DIR, filePath);
    ensureDir(fullPath);
    fs.writeFileSync(fullPath, buffer);

    const publicUrl = `${BASE_URL.replace(/\/$/, "")}/${filePath.replace(/\\/g, "/")}`;
    return publicUrl;
  },

  /**
   * Return the public URL for a file that was already uploaded.
   */
  async getSignedUrl(filePath: string, _expiresIn = 3600) {
    return `${BASE_URL.replace(/\/$/, "")}/${filePath.replace(/\\/g, "/")}`;
  },

  /**
   * Delete a file from the local disk.
   */
  async delete(filePath: string) {
    const fullPath = path.join(UPLOADS_DIR, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  },
};
