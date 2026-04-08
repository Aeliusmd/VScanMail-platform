import {
  archivedChequesData,
  archivedMailsData,
  type ArchivedCheque,
  type ArchivedMail,
} from "../mocks/archived";

type ArchiveType = "mail" | "cheque";

export type AdminArchiveResponse = {
  mails: ArchivedMail[];
  cheques: ArchivedCheque[];
};

export const FALLBACK_ARCHIVE: AdminArchiveResponse = {
  mails: archivedMailsData,
  cheques: archivedChequesData,
};

const apiBase = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function fetchAdminArchive(companyId = "demo"): Promise<AdminArchiveResponse> {
  const url = `${apiBase()}/api/admin/archive?companyId=${encodeURIComponent(companyId)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Archive request failed (${res.status})`);
  }
  return res.json() as Promise<AdminArchiveResponse>;
}

export async function unarchiveAdminItem(
  params: { type: ArchiveType; id: string },
  companyId = "demo"
): Promise<void> {
  const res = await fetch(`${apiBase()}/api/admin/archive/unarchive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, companyId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Unarchive request failed (${res.status})`);
  }
}
