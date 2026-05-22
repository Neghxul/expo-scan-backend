import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";

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

export async function createRecord(params: {
  userId: string;
  qrRaw: string;
  badgeNumber?: string | null;
  eventName?: string | null;
  fields: Record<string, string>;
  phone?: string | null;
  email?: string | null;
}) {
  const { userId, qrRaw, badgeNumber, eventName, fields, phone, email } = params;
  const hasOne = Boolean(phone?.trim()) || Boolean(email?.trim()) || Boolean(fields?.Whatsapp?.trim());
  const normalizedBadge = badgeNumber?.trim() || null;
  const normalizedEvent = eventName?.trim() || null;

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

  return prisma.record.create({
    data: {
      userId,
      qrRaw,
      badgeNumber: normalizedBadge,
      eventName: normalizedEvent,
      fields,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
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

export async function updateRecord(id: string, userId: string, userRole: Role, data: any) {
  const record = await prisma.record.findUnique({ where: { id } });
  if (!record) throw new Error("RECORD_NOT_FOUND");
  if (!canEditRecord(userRole, record.userId, userId)) throw new Error("UNAUTHORIZED");
  const nextBadge = data.badgeNumber !== undefined ? data.badgeNumber : record.badgeNumber;
  const nextEvent = data.eventName !== undefined ? data.eventName : record.eventName;

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

  return prisma.record.update({
    where: { id },
    data: {
      badgeNumber: data.badgeNumber !== undefined ? data.badgeNumber : record.badgeNumber,
      eventName: data.eventName !== undefined ? data.eventName : record.eventName,
      fields: data.fields !== undefined ? data.fields : (record.fields as any),
      phone: data.phone !== undefined ? data.phone : record.phone,
      email: data.email !== undefined ? data.email : record.email,
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
