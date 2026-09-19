"use server";

import { db } from "@/lib/db";
import { RequestStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { notifyStatusChange } from "@/lib/notify";

interface SubmitDepartmentResponseInput {
  applicationId: string;
  responseType: "ACKNOWLEDGE" | "PROVIDE_INFO";
  responseText: string;
  attachmentUrl?: string;
}

export async function submitDepartmentResponse({
  applicationId,
  responseType,
  responseText,
  attachmentUrl,
}: SubmitDepartmentResponseInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized access." };
    }

    const application = await db.giftRequest.findUnique({
      where: { id: applicationId },
      select: { title: true, userId: true },
    });

    if (!application) {
      return { success: false, error: "Application not found." };
    }

    await db.$transaction(async (tx) => {
      // 1. Save department response & update status to SENATE_PROCESSING.
      // Only Senate ever puts a request into AWAITING_DEPARTMENT_RESPONSE,
      // so the response always routes back to Senate for further
      // processing before it eventually reaches Council.
      await tx.giftRequest.update({
        where: { id: applicationId },
        data: {
          departmentResponse: responseText,
          ...(attachmentUrl && { departmentAttachment: attachmentUrl }),
          status: RequestStatus.SENATE_PROCESSING,
        },
      });

      // 2. Log comment entry
      await tx.comment.create({
        data: {
          content: `Department submitted response: "${responseText}". Status updated to Senate Processing for final consideration.`,
          giftRequest: { connect: { id: applicationId } },
          author: { connect: { id: session.user.id } },
        },
      });
    });

    await notifyStatusChange({
      requestId: applicationId,
      title: application.title ?? "Untitled application",
      applicantUserId: application.userId,
      newStatus: RequestStatus.SENATE_PROCESSING,
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("Department response error:", err);
    return { success: false, error: "Failed to submit department response." };
  }
}