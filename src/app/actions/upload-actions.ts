"use server";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

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

    const result = await utapi.uploadFiles(file);

    if (result.error) {
      return { success: false, error: `File upload failed: ${result.error.message}` };
    }

    return {
      success: true,
      url: result.data.url,
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