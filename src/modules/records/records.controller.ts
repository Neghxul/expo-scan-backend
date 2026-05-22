import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { createRecordSchema, listRecordsQuerySchema, updateRecordSchema } from "./records.schemas";
import { createRecord, deleteRecord, listRecords, updateRecord } from "./records.service";

export async function createRecordController(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = createRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    }

    const record = await createRecord({ userId: user.id, ...parsed.data });
    return res.status(201).json(record);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PHONE_OR_EMAIL_REQUIRED") return res.status(400).json({ message: "Phone, WhatsApp or email is required" });
      if (error.message === "INVALID_PHONE") return res.status(400).json({ message: "Invalid phone" });
      if (error.message === "INVALID_EMAIL") return res.status(400).json({ message: "Invalid email" });
      if (error.message === "DUPLICATE_BADGE") {
        return res.status(409).json({
          message: "Este gafete ya fue registrado",
          record: (error as Error & { record?: unknown }).record,
        });
      }
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function listRecordsController(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = listRecordsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid query params", errors: parsed.error.flatten() });
    }

    const records = await listRecords({
      requesterId: user.id,
      requesterRole: user.role,
      ...parsed.data,
    });

    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateRecordController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = updateRecordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

    const updated = await updateRecord(id, user.id, user.role, parsed.data);
    return res.status(200).json(updated);
  } catch (error: any) {
    if (error.message === "RECORD_NOT_FOUND") return res.status(404).json({ message: "Registro no encontrado" });
    if (error.message === "UNAUTHORIZED") return res.status(403).json({ message: "No tienes permiso para editar este registro" });
    if (error.message === "DUPLICATE_BADGE") return res.status(409).json({ message: "Este gafete ya fue registrado", record: error.record });
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteRecordController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    await deleteRecord(id, user.id, user.role);
    return res.status(200).json({ message: "Registro eliminado exitosamente" });
  } catch (error: any) {
    if (error.message === "RECORD_NOT_FOUND") return res.status(404).json({ message: "Registro no encontrado" });
    if (error.message === "UNAUTHORIZED") return res.status(403).json({ message: "No tienes permiso para eliminar este registro" });
    return res.status(500).json({ message: "Internal server error" });
  }
}
