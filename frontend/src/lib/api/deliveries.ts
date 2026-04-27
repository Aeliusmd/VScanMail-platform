import { apiClient } from "../api-client";

export type DeliveryStatus = "pending" | "approved" | "rejected" | "in_transit" | "delivered" | "cancelled";
export type DeliverySourceType = "cheque" | "mail";

export type DeliveryDto = {
  id: string;
  sourceType: DeliverySourceType;
  irn: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  amountFigures: number | null;
  chequeStatus: string | null;
  requestedAt: string | null;
  requestedBy: string | null;
  status: DeliveryStatus | null;
  preferredDate: string | null;
  notes: string | null;
  addressId: string | null;
  addressName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  addressCountry: string | null;
  addressPhone: string | null;
  addressEmail: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  rejectReason: string | null;
  inTransitAt: string | null;
  markedDeliveredBy: string | null;
  markedDeliveredAt: string | null;
  vSendDocsSubmissionId: string | null;
  vSendDocsSubmissionNumber: string | null;
  trackingNumber: string | null;
  proofOfServiceUrl: string | null;
};

export const deliveriesApi = {
  requestChequeDelivery: async (
    chequeId: string,
    input: { addressId: string; preferredDate?: string; notes?: string }
  ): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/records/cheques/${chequeId}/delivery`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  requestMailDelivery: async (
    mailId: string,
    input: { addressId: string; preferredDate?: string; notes?: string }
  ): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/records/mail/${mailId}/delivery`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  cancel: async (id: string, sourceType: DeliverySourceType): Promise<void> => {
    const base = sourceType === "cheque" ? "cheques" : "mail";
    await apiClient<{ ok: true }>(`/api/records/${base}/${id}/delivery`, {
      method: "DELETE",
    });
  },

  listMine: async (): Promise<DeliveryDto[]> => {
    const res = await apiClient<{ deliveries: DeliveryDto[] }>(`/api/customer/deliveries`, {
      method: "GET",
    });
    return res.deliveries || [];
  },

  adminList: async (): Promise<DeliveryDto[]> => {
    const res = await apiClient<{ deliveries: DeliveryDto[] }>(`/api/admin/deliveries`, {
      method: "GET",
    });
    return res.deliveries || [];
  },

  adminApprove: async (id: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/admin/deliveries/${id}/approve`, { method: "POST" });
  },

  adminReject: async (id: string, reason: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/admin/deliveries/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  adminMarkInTransit: async (
    id: string,
    input: { submissionId?: string; submissionNumber?: string; trackingNumber: string }
  ): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/admin/deliveries/${id}/mark-in-transit`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  adminMarkDelivered: async (id: string, proofOfServiceUrl: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/admin/deliveries/${id}/mark-delivered`, {
      method: "POST",
      body: JSON.stringify({ proofOfServiceUrl }),
    });
  },
};
