"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { mailApi, type MailType } from "@/lib/api/mail";
import { companyApi, type Client } from "@/lib/api/companies";

export default function ScanDocumentPage() {
  const router = useRouter();

  const [clientId, setClientId] = useState<string | null>(null);
  const [type, setType] = useState<MailType>("letter");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [contentFiles, setContentFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [isOperator, setIsOperator] = useState(false);
  const [initDone, setInitDone] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const init = async () => {
    setBootstrapLoading(true);
    setBootstrapError(null);
    try {
      const me = await authApi.me();
      const role = me?.role;
      const resolvedClientId: string | null =
        me?.clientId ?? me?.client?.id ?? null;

      // Admins and operators should see the full client dropdown
      if (role === "admin" || role === "operator") {
        setIsOperator(true);
        const res = await companyApi.list({ limit: 100 });
        setClients(res.clients || []);
        if (res.clients?.length > 0) {
          setClientId(res.clients[0].id);
        } else {
          setClientId(null);
        }
      } else if (resolvedClientId) {
        setClientId(resolvedClientId);
        setIsOperator(false);
      } else {
        setClientId(null);
        setIsOperator(false);
        setBootstrapError(
          "Your account has no company linked. Complete registration or ask an admin to fix your profile. " +
            "The header label \"Admin User\" is only demo text — your real role comes from the server."
        );
      }
    } catch (e) {
      setClientId(null);
      setIsOperator(false);
      setBootstrapError(
        e instanceof Error ? e.message : "Could not load your account. Check that the API is running and you are signed in."
      );
    } finally {
      setBootstrapLoading(false);
      setInitDone(true);
    }
  };

  // Load client data on page mount, not just on submit
  useEffect(() => {
    void init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError(
        isOperator
          ? "Select a client company from the list (or register a company first)."
          : "Missing client context. Sign in with a company account or use an admin/operator account to choose a client."
      );
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

        {bootstrapError && (
          <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {bootstrapError}
          </p>
        )}

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
              {bootstrapLoading ? (
                <div className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 text-sm">
                  Loading account…
                </div>
              ) : isOperator ? (
                <>
                  <select
                    value={clientId || ""}
                    onChange={(e) => setClientId(e.target.value)}
                    className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0A3D8F]/20"
                  >
                    <option value="" disabled>
                      {clients.length === 0 ? "No companies yet — register a client first" : "Select a client…"}
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.client_code})
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && initDone && (
                    <p className="mt-1 text-xs text-slate-500">
                      Operators need at least one registered company in the database.
                    </p>
                  )}
                </>
              ) : (
                <input
                  value={clientId || ""}
                  readOnly
                  placeholder={bootstrapLoading ? "Loading…" : "No company linked"}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700"
                />
              )}
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

