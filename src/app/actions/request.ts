"use server";

import { db } from "@/lib/db";
import { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function resubmitRequest({
  requestId,
  title,
  description, // We'll map this to your schema's "purpose" field
  amount,
  userId,
}: {
  requestId: string;
  title: string;
  description: string;
  amount: number;
  userId: string;
}) {
  try {
    // 1. Use prisma.giftRequest instead of prisma.request
    const existingRequest = await db.giftRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return { success: false, message: "Request not found." };
    }

    if (existingRequest.status !== RequestStatus.REVISION_REQUESTED) {
      return { success: false, message: "Only requests with 'REVISION_REQUESTED' status can be resubmitted." };
    }

    // 2. Update using prisma.giftRequest
    await db.$transaction([
      db.giftRequest.update({
        where: { id: requestId },
        data: {
          title,
          purpose: description, // Mapped to 'purpose' per your schema
          amount,
          status: RequestStatus.SUBMITTED, // Reset status back to pending
        },
      }),
      db.activityLog.create({
        data: {
          giftRequestId: requestId, // Mapped to 'giftRequestId' per your schema
          userId,
          action: "REVISION_RESUBMITTED",
          details: "Applicant revised and resubmitted proposal specs.", // Required by your schema
          notes: "Resubmitted with updated budget and justification.", 
        },
      }),
    ]);

    revalidatePath("/requests");
    revalidatePath("/reviewer");

    return { success: true, message: "Proposal resubmitted successfully!" };
  } catch (error) {
    console.error("Failed to resubmit request:", error);
    return { success: false, message: "Server error while resubmitting proposal." };
  }
}