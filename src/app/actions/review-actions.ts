"use server";

import { db } from "@/lib/db";
import { RequestStatus, Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { notifyDecisionExtractIssued, notifyFinalApproval } from "@/lib/notify";

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

    const normalizedStage = stage.toLowerCase();
    const isSenateProcessing = normalizedStage === "senate-processing";

    // 🔒 Bypass/Strip decisionExtractUrl if we are in senate-processing stage
    const extractUrlToSave = isSenateProcessing ? undefined : decisionExtractUrl;

    let targetStatus: RequestStatus = nextStatus;

    if (decision === "REJECT") {
      targetStatus = RequestStatus.REJECTED;
    } else if (decision === "REQUEST_INFO") {
      targetStatus = RequestStatus.REVISION_REQUESTED;
    }

    const issuingRole = STAGE_TO_ROLE[normalizedStage];

    await db.$transaction(async (tx) => {
      // 1. Update Gift Request status and stage
      await tx.giftRequest.update({
        where: { id: applicationId },
        data: {
          status: targetStatus,
          ...(extractUrlToSave && { decisionExtractUrl: extractUrlToSave }),
          ...(issuingRole && { currentStage: issuingRole }),
        },
      });

      // 2. Audit Trail Comment
      let auditMsg = comment || `Status updated to ${targetStatus}`;

      if (extractUrlToSave) {
        // Only initial Senate review issues a Decision Extract.
        auditMsg = `Senate issued Decision Extract: ${extractUrlToSave}. Awaiting department response.`;
      } else if (isSenateProcessing && targetStatus === RequestStatus.COUNCIL_REVIEW) {
        auditMsg = comment 
          ? `Senate completed consideration on department response: ${comment}. Forwarded to Council.` 
          : `Senate completed consideration on department response. Forwarded to Council for final approval.`;
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

    // 3. Notify on Decision Extract issued (Initial Senate review only)
    if (extractUrlToSave) {
      await notifyDecisionExtractIssued({
        requestId: applicationId,
        title: application.title ?? "Untitled application",
        applicantEmail: application.user.email,
        issuedByStage: normalizedStage,
        extractUrl: extractUrlToSave,
      });
    }

    // 4. Notify on Final Approval (Council approval path)
    if (targetStatus === RequestStatus.APPROVED) {
      await notifyFinalApproval({
        requestId: applicationId,
        title: application.title ?? "Untitled application",
        applicantEmail: application.user.email,
        extractUrl: application.decisionExtractUrl,
      });
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Review action error:", err);
    return { success: false, error: "Failed to process review decision." };
  }
}