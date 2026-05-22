import { Router } from "express";
import { createRecordController, listRecordsController, deleteRecordController, updateRecordController } from "./records.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, createRecordController);
router.get("/", requireAuth, listRecordsController);
router.delete("/:id", requireAuth, deleteRecordController);
router.put("/:id", requireAuth, updateRecordController); // <-- NUEVA RUTA AQUÍ

export default router;