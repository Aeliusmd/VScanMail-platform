import { apiClient } from "../api-client";

export type DeliveryAddress = {
  id: string;
  clientId: string;
  label: string;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export const deliveryAddressesApi = {
  list: async (): Promise<DeliveryAddress[]> => {
    const res = await apiClient<{ deliveryAddresses: DeliveryAddress[] }>("/api/customer/delivery-addresses", {
      method: "GET",
    });
    return res.deliveryAddresses || [];
  },

  create: async (input: Omit<DeliveryAddress, "id" | "clientId" | "createdAt" | "updatedAt">): Promise<DeliveryAddress> => {
    const res = await apiClient<{ deliveryAddress: DeliveryAddress }>("/api/customer/delivery-addresses", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.deliveryAddress;
  },

  update: async (
    id: string,
    input: Partial<Omit<DeliveryAddress, "id" | "clientId" | "createdAt" | "updatedAt">>
  ): Promise<DeliveryAddress> => {
    const res = await apiClient<{ deliveryAddress: DeliveryAddress }>(`/api/customer/delivery-addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return res.deliveryAddress;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient<{ ok: true }>(`/api/customer/delivery-addresses/${id}`, {
      method: "DELETE",
    });
  },
};
