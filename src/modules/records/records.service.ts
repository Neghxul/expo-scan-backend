import { Prisma, Role } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "../../config/prisma";
import { getManualEventDefault, reserveManualBadgeNumber } from "../settings/settings.service";

function isValidEmail(email?: string | null) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone?: string | null) {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}

function canSeeAllRecords(role: Role) {
  return ["ADMIN", "MANAGER", "DIRECTOR", "MARKETING"].includes(role);
}

function canEditRecord(role: Role, ownerId: string, requesterId: string) {
  if (role === "ADMIN" || role === "DIRECTOR") return true;
  return role === "SELLER" && ownerId === requesterId;
}

function canDeleteRecord(role: Role, ownerId: string, requesterId: string) {
  if (role === "ADMIN" || role === "DIRECTOR") return true;
  return role === "SELLER" && ownerId === requesterId;
}

function validateRequiredFields(fields: Record<string, string>) {
  if (!fields.Puesto?.trim()) throw new Error("POSITION_REQUIRED");
  if (!fields.Notas?.trim()) throw new Error("NOTES_REQUIRED");
  if (!["01", "02", "03"].includes(fields.LeadPriority || "")) throw new Error("PRIORITY_REQUIRED");
}

async function saveBusinessCardImage(base64?: string | null, mimeType?: string | null, baseUrl?: string) {
  if (!base64?.trim()) return null;

  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  if (buffer.length > 2_500_000) throw new Error("BUSINESS_CARD_TOO_LARGE");

  const extension = mimeType?.includes("png") ? "png" : "jpg";
  const dir = path.join(process.cwd(), "uploads", "business-cards");
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(dir, fileName), buffer);

  return `${baseUrl || ""}/uploads/business-cards/${fileName}`;
}

export async function createRecord(params: {
  userId: string;
  qrRaw: string;
  badgeNumber?: string | null;
  eventName?: string | null;
  fields: Record<string, string>;
  phone?: string | null;
  email?: string | null;
  isManual?: boolean;
  businessCardBase64?: string | null;
  businessCardMimeType?: string | null;
  baseUrl?: string;
}) {
  const { userId, qrRaw, badgeNumber, eventName, fields, phone, email } = params;
  const hasOne = Boolean(phone?.trim()) || Boolean(email?.trim()) || Boolean(fields?.Whatsapp?.trim());
  let normalizedBadge = badgeNumber?.trim() || null;
  let normalizedEvent = eventName?.trim() || null;

  if (params.isManual) {
    if (!normalizedBadge || /^MAN/i.test(normalizedBadge)) normalizedBadge = await reserveManualBadgeNumber();
    if (!normalizedEvent) normalizedEvent = await getManualEventDefault();
  }

  validateRequiredFields(fields);
  if (!hasOne) throw new Error("PHONE_OR_EMAIL_REQUIRED");
  if (!isValidPhone(phone)) throw new Error("INVALID_PHONE");
  if (!isValidEmail(email)) throw new Error("INVALID_EMAIL");
  if (normalizedBadge && normalizedEvent) {
    const existing = await prisma.record.findFirst({
      where: {
        badgeNumber: normalizedBadge,
        eventName: normalizedEvent,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (existing) {
      const error = new Error("DUPLICATE_BADGE") as Error & { record?: typeof existing };
      error.record = existing;
      throw error;
    }
  }

  const businessCardUrl = await saveBusinessCardImage(params.businessCardBase64, params.businessCardMimeType, params.baseUrl);

  return prisma.record.create({
    data: {
      userId,
      qrRaw: qrRaw || [normalizedBadge || "", normalizedEvent || "", fields.Nombre || "", fields.Apellido || "", fields.Empresa || ""].join("$"),
      badgeNumber: normalizedBadge,
      eventName: normalizedEvent,
      fields,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      businessCardUrl,
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

export async function listRecords(params: {
  requesterId: string;
  requesterRole: Role;
  userId?: string;
  q?: string;
  badgeNumber?: string;
  eventName?: string;
  from?: string;
  to?: string;
}) {
  const { requesterId, requesterRole, userId, q, badgeNumber, eventName, from, to } = params;
  const where: Prisma.RecordWhereInput = {};

  if (!canSeeAllRecords(requesterRole)) {
    where.userId = requesterId;
  } else if (userId) {
    where.userId = userId;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  if (badgeNumber?.trim()) where.badgeNumber = badgeNumber.trim();
  if (eventName?.trim()) where.eventName = eventName.trim();

  if (q?.trim()) {
    const query = q.trim();
    where.OR = [
      { qrRaw: { contains: query } },
      { badgeNumber: { contains: query } },
      { eventName: { contains: query } },
      { phone: { contains: query } },
      { email: { contains: query } },
    ];
  }

  return prisma.record.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

export async function updateRecord(id: string, userId: string, userRole: Role, data: any, baseUrl?: string) {
  const record = await prisma.record.findUnique({ where: { id } });
  if (!record) throw new Error("RECORD_NOT_FOUND");
  if (!canEditRecord(userRole, record.userId, userId)) throw new Error("UNAUTHORIZED");
  const nextBadge = data.badgeNumber !== undefined ? data.badgeNumber : record.badgeNumber;
  const nextEvent = data.eventName !== undefined ? data.eventName : record.eventName;
  const nextFields = data.fields !== undefined ? data.fields : (record.fields as Record<string, string>);

  validateRequiredFields(nextFields);
  if (!isValidPhone(data.phone ?? record.phone)) throw new Error("INVALID_PHONE");
  if (!isValidEmail(data.email ?? record.email)) throw new Error("INVALID_EMAIL");
  if (nextBadge && nextEvent) {
    const existing = await prisma.record.findFirst({
      where: {
        id: { not: id },
        badgeNumber: nextBadge,
        eventName: nextEvent,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (existing) {
      const error = new Error("DUPLICATE_BADGE") as Error & { record?: typeof existing };
      error.record = existing;
      throw error;
    }
  }

  const nextBusinessCardUrl = await saveBusinessCardImage(data.businessCardBase64, data.businessCardMimeType, baseUrl);

  return prisma.record.update({
    where: { id },
    data: {
      badgeNumber: data.badgeNumber !== undefined ? data.badgeNumber : record.badgeNumber,
      eventName: data.eventName !== undefined ? data.eventName : record.eventName,
      fields: nextFields,
      phone: data.phone !== undefined ? data.phone : record.phone,
      email: data.email !== undefined ? data.email : record.email,
      businessCardUrl: nextBusinessCardUrl || record.businessCardUrl,
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}

export async function deleteRecord(id: string, userId: string, userRole: Role) {
  const record = await prisma.record.findUnique({ where: { id } });
  if (!record) throw new Error("RECORD_NOT_FOUND");
  if (!canDeleteRecord(userRole, record.userId, userId)) throw new Error("UNAUTHORIZED");

  await prisma.record.delete({ where: { id } });
}
