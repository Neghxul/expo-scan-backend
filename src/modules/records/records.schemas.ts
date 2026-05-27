import { z } from "zod";

export const createRecordSchema = z.object({
  qrRaw: z.string().min(1),
  badgeNumber: z.string().optional().nullable(),
  eventName: z.string().optional().nullable(),
  fields: z.record(z.string()),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  isManual: z.boolean().optional(),
  businessCardBase64: z.string().optional().nullable(),
  businessCardMimeType: z.string().optional().nullable(),
});

export const listRecordsQuerySchema = z.object({
  userId: z.string().optional(),
  q: z.string().optional(),
  badgeNumber: z.string().optional(),
  eventName: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const updateRecordSchema = z.object({
  badgeNumber: z.string().nullable().optional(),
  eventName: z.string().nullable().optional(),
  fields: z.record(z.string()).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  businessCardBase64: z.string().nullable().optional(),
  businessCardMimeType: z.string().nullable().optional(),
});
