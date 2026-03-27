"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { mailApi, type MailType } from "@/lib/api/mail";

export default function ScanDocumentPage() {
  const router = useRouter();

  const [clientId, setClientId] = useState<string | null>(null);
  const [type, setType] = useState<MailType>("letter");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [contentFiles, setContentFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialized, setInitialized] = useState(false);

  const init = async () => {
    if (initialized) return;
    setInitialized(true);
    try {
      const me = await authApi.me();
      setClientId(me?.clientId ?? null);
    } catch {
      setClientId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    await init();

    if (!clientId) {
      setError("Missing client context. Please sign in as an operator.");
      return;
    }
    if (!frontFile || !backFile) {
      setError("Front and back envelope images are required.");
      return;
    }

    const form = new FormData();
    form.append("clientId", clientId);
    form.append("type", type);
    form.append("front", frontFile);
    form.append("back", backFile);
    for (const f of contentFiles) form.append("content", f);

    try {
      setLoading(true);
      await mailApi.upload(form);
      router.push("/dashboard/mails");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6">
        <h1 className="text-lg font-bold text-slate-900">Scan Document</h1>
        <p className="text-sm text-slate-600 mt-1">
          Upload front/back envelope images (and optional inner pages). Backend
          will run tamper detection + AI summary.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MailType)}
                className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
              >
                <option value="letter">Letter</option>
                <option value="package">Package</option>
                <option value="legal">Legal</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Client</label>
              <input
                value={clientId || ""}
                readOnly
                className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Front image (required)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
              className="mt-2 w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Back image (required)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBackFile(e.target.files?.[0] || null)}
              className="mt-2 w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Inner pages (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setContentFiles(Array.from(e.target.files || []))
              }
              className="mt-2 w-full"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#0A3D8F] text-white font-semibold text-sm hover:bg-[#083170] transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Uploading..." : "Upload & Process"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/mails")}
              className="py-2.5 px-4 rounded-lg border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

