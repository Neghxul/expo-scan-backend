"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveBase64Image = saveBase64Image;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
async function saveBase64Image(params) {
    if (!params.base64?.trim())
        return null;
    const cleanBase64 = params.base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    if (buffer.length > (params.maxBytes || 2500000))
        throw new Error("IMAGE_TOO_LARGE");
    const extension = params.mimeType?.includes("png") ? "png" : "jpg";
    const dir = path_1.default.join(process.cwd(), "uploads", params.folder);
    await promises_1.default.mkdir(dir, { recursive: true });
    const fileName = `${Date.now()}-${(0, crypto_1.randomUUID)()}.${extension}`;
    await promises_1.default.writeFile(path_1.default.join(dir, fileName), buffer);
    return `${params.baseUrl || ""}/uploads/${params.folder}/${fileName}`;
}
