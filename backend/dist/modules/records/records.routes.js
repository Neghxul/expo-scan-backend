"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const records_controller_1 = require("./records.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.requireAuth, records_controller_1.createRecordController);
router.get("/", auth_middleware_1.requireAuth, records_controller_1.listRecordsController);
router.delete("/:id", auth_middleware_1.requireAuth, records_controller_1.deleteRecordController);
router.put("/:id", auth_middleware_1.requireAuth, records_controller_1.updateRecordController); // <-- NUEVA RUTA AQUÍ
exports.default = router;
