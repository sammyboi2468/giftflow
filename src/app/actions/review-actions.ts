"use server";

import { db } from "@/lib/db";
import { RequestStatus, Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { notifyDecisionExtractIssued, notifyFinalApproval } from "@/lib/notify";
import { generateAppreciationLetter } from "@/lib/generateAppreciationLetter";

interface ProcessReviewInput {
  applicationId: string;
  decision: "APPROVE" | "REJECT" | "REQUEST_INFO";
  comment?: string;
  nextStatus: RequestStatus;
  decisionExtractUrl?: string;
  stage: string;
}

const STAGE_TO_ROLE: Record<string, Role> = {
  advancement: Role.ADVANCEMENT_OFFICE,
  senate: Role.SENATE_DIVISION,
  "senate-processing": Role.SENATE_DIVISION,
  council: Role.COUNCIL,
};

export async function processApplicationReview({
  applicationId,
  decision,
  comment,
  nextStatus,
  decisionExtractUrl,
  stage,
}: ProcessReviewInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized access" };
    }

    const application = await db.giftRequest.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    let targetStatus: RequestStatus = nextStatus;

    if (decision === "REJECT") {
      targetStatus = RequestStatus.REJECTED;
    } else if (decision === "REQUEST_INFO" && !decisionExtractUrl) {
      targetStatus = RequestStatus.REVISION_REQUESTED;
    }

    const normalizedStage = stage.toLowerCase();
    const issuingRole = STAGE_TO_ROLE[normalizedStage];

    await db.$transaction(async (tx) => {
      await tx.giftRequest.update({
        where: { id: applicationId },
        data: {
          status: targetStatus,
          ...(decisionExtractUrl && { decisionExtractUrl }),
          ...(issuingRole && { currentStage: issuingRole }),
        },
      });

      let auditMsg = comment || `Status updated to ${targetStatus}`;
      if (decisionExtractUrl) {
        auditMsg = `Senate issued Decision Extract: ${decisionExtractUrl}. Awaiting department response.`;
      } else if (targetStatus === RequestStatus.COUNCIL_REVIEW) {
        auditMsg = `Forwarded to Council for final approval.`;
      } else if (targetStatus === RequestStatus.APPROVED) {
        auditMsg = `Council granted final approval. Application process completed.`;
      }

      await tx.comment.create({
        data: {
          content: auditMsg,
          giftRequest: { connect: { id: applicationId } },
          author: { connect: { id: session.user.id } },
        },
      });
    });

    if (decisionExtractUrl) {
      await notifyDecisionExtractIssued({
        requestId: applicationId,
        title: application.title ?? "Untitled application",
        applicantEmail: application.user.email,
        applicantUserId: application.userId,
        issuedByStage: normalizedStage,
        extractUrl: decisionExtractUrl,
      });
    }

    if (targetStatus === RequestStatus.APPROVED) {
      // Immediately generate a formal appreciation letter PDF and store its
      // URL on the request. Emailing it to the donor is a follow-up step
      // once donor email addresses / email sending are set up.
      const letterUrl = await generateAppreciationLetter({
        requestId: applicationId,
        donorName: application.donorName || "Valued Donor",
        giftTitle: application.title || "your generous gift",
        giftType: application.giftType,
        amount: application.amount,
        currency: application.currency,
        purpose: application.purpose,
        department: application.department,
      });

      await db.giftRequest.update({
        where: { id: applicationId },
        data: { appreciationLetterUrl: letterUrl },
      });

      await notifyFinalApproval({
        requestId: applicationId,
        title: application.title ?? "Untitled application",
        applicantUserId: application.userId,
        extractUrl: application.decisionExtractUrl,
      });
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Review action error:", err);
    return { success: false, error: "Failed to process review decision." };
  }
}