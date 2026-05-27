import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function saveBase64Image(params: {
  base64?: string | null;
  mimeType?: string | null;
  folder: string;
  baseUrl?: string;
  maxBytes?: number;
}) {
  if (!params.base64?.trim()) return null;

  const cleanBase64 = params.base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  if (buffer.length > (params.maxBytes || 2_500_000)) throw new Error("IMAGE_TOO_LARGE");

  const extension = params.mimeType?.includes("png") ? "png" : "jpg";
  const dir = path.join(process.cwd(), "uploads", params.folder);
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(dir, fileName), buffer);

  return `${params.baseUrl || ""}/uploads/${params.folder}/${fileName}`;
}
