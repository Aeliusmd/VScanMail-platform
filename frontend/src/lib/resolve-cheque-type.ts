export type ChequeTypeKind = "original" | "returned" | "unknown";

type ResolveSources = {
  chequeType?: string | null;
  aiRawResult?: Record<string, unknown> | null;
  typeClassification?: {
    type?: string;
    confidence?: number;
    indicators?: string[];
  } | null;
};

/** Maps admin scan selection + AI classification to original (Valid) / returned / unknown. */
export function resolveChequeType(sources: ResolveSources): ChequeTypeKind {
  const ai = sources.aiRawResult ?? undefined;
  const adminStatus = ai?.admin_cheque_status;
  if (adminStatus === "valid") return "original";
  if (adminStatus === "returned") return "returned";

  const fromColumn = sources.chequeType;
  if (fromColumn === "original" || fromColumn === "returned") return fromColumn;

  const tc = sources.typeClassification ?? (ai?.type_classification as ResolveSources["typeClassification"]);
  const type = tc?.type;
  if (type === "returned") return "returned";
  if (type === "original") return "original";

  if (
    type === "unknown" &&
    typeof tc?.confidence === "number" &&
    tc.confidence >= 0.7 &&
    !(tc.indicators?.length)
  ) {
    return "original";
  }

  return "unknown";
}

export function chequeTypeDisplayLabel(type: ChequeTypeKind): string {
  if (type === "original") return "Valid";
  if (type === "returned") return "Returned";
  return "Not classified";
}
