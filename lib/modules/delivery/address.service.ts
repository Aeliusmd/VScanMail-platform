import { auditService } from "../audit/audit.service";
import { deliveryAddressModel, type DeliveryAddressListItem } from "./address.model";
import type { CreateDeliveryAddressInput, UpdateDeliveryAddressInput } from "./address.schema";

function normalizeInput<T extends Record<string, unknown>>(input: T): T {
  const out = { ...input } as Record<string, unknown>;
  for (const key of ["label", "recipientName", "line1", "line2", "city", "state", "zip", "country", "phone", "email"]) {
    const value = out[key];
    if (typeof value === "string") out[key] = value.trim();
  }
  if (typeof out.country === "string") out.country = out.country.toUpperCase();
  return out as T;
}

export const deliveryAddressService = {
  async listForClient(clientId: string): Promise<DeliveryAddressListItem[]> {
    return deliveryAddressModel.listActiveByClient(clientId);
  },

  async createForClient(params: {
    actorId: string;
    actorRole: "client" | "admin" | "super_admin" | "operator";
    clientId: string;
    input: CreateDeliveryAddressInput;
    req?: Request;
  }): Promise<DeliveryAddressListItem> {
    const input = normalizeInput(params.input);
    const created = await deliveryAddressModel.createForClient({
      clientId: params.clientId,
      createdBy: params.actorId,
      ...input,
    });

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "delivery_address.created",
      entity: created.id,
      clientId: params.clientId,
      after: { id: created.id, label: created.label, isDefault: created.isDefault },
      req: params.req,
    });

    const rows = await deliveryAddressModel.listActiveByClient(params.clientId);
    const dto = rows.find((r) => r.id === created.id);
    if (!dto) throw new Error("Failed to load delivery address");
    return dto;
  },

  async updateForClient(params: {
    actorId: string;
    actorRole: "client" | "admin" | "super_admin" | "operator";
    clientId: string;
    addressId: string;
    input: UpdateDeliveryAddressInput;
    req?: Request;
  }): Promise<DeliveryAddressListItem> {
    const normalized = normalizeInput(params.input);
    await deliveryAddressModel.updateForClient(params.clientId, params.addressId, normalized);

    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "delivery_address.updated",
      entity: params.addressId,
      clientId: params.clientId,
      after: { id: params.addressId },
      req: params.req,
    });

    const rows = await deliveryAddressModel.listActiveByClient(params.clientId);
    const dto = rows.find((r) => r.id === params.addressId);
    if (!dto) throw new Error("Delivery address not found");
    return dto;
  },

  async removeForClient(params: {
    actorId: string;
    actorRole: "client" | "admin" | "super_admin" | "operator";
    clientId: string;
    addressId: string;
    req?: Request;
  }): Promise<void> {
    await deliveryAddressModel.softDelete(params.clientId, params.addressId);
    await auditService.log({
      actor: params.actorId,
      actor_role: params.actorRole,
      action: "delivery_address.deleted",
      entity: params.addressId,
      clientId: params.clientId,
      req: params.req,
    });
  },
};
