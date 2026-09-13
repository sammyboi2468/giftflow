import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const utapi = new UTApi();

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: `Invalid content type: expected multipart/form-data, got ${contentType}` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No valid file object was found in the 'file' key." },
        { status: 400 }
      );
    }

    const result = await utapi.uploadFiles(file);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return NextResponse.json({
      url: result.data.url,
      originalName: file.name,
    });
  } catch (err: unknown) {
    const errorText = err instanceof Error ? err.message : String(err);
    console.error("[UPLOAD_ROUTE_ERROR]:", errorText);

    return NextResponse.json(
      { error: `Upload failed: ${errorText}` },
      { status: 400 }
    );
  }
}