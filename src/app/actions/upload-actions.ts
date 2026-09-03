"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function uploadExtractFile(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  originalName?: string;
  error?: string;
}> {
  try {
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string" || !file.name) {
      return { success: false, error: "No valid file selected." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save destination: public/uploads inside project directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique, sanitized filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${uniqueSuffix}-${sanitizedName}`;
    const filePath = path.join(uploadDir, filename);

    // Write file to disk
    await writeFile(filePath, buffer);

    return {
      success: true,
      url: `/uploads/${filename}`,
      originalName: file.name,
    };
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("[SERVER_ACTION_UPLOAD_ERROR]:", errorDetails);
    return {
      success: false,
      error: `File upload failed: ${errorDetails}`,
    };
  }
}