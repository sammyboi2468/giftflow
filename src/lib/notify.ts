// Shared notification helpers used by review-actions.ts. Writes to
// ActivityLog -- there is no separate Notification model in the schema;
// this is what getUserNotifications() reads from.

import { db } from "@/lib/db";
import { Role } from "@prisma/client";

async function getUserIdsByRole(role: Role): Promise<string[]> {
  const users = await db.user.findMany({ where: { role }, select: { id: true } });
  return users.map((u) => u.id);
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  ADVANCEMENT_REVIEW: "Advancement Review",
  SENATE_REVIEW: "Senate Review",
  SENATE_PROCESSING: "Senate Processing",
  COUNCIL_REVIEW: "Council Review",
  AWAITING_DEPARTMENT_RESPONSE: "Awaiting Department Response",
  REVISION_REQUESTED: "Revision Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PENDING: "Pending",
};

// General "your request moved to a new stage" notice for the applicant.
// Used for every transition that isn't already covered by a more specific
// notifier (decision-extract-issued, final-approval) so those don't get a
// redundant duplicate message on top of their own detailed one.
export async function notifyStatusChange({
  requestId,
  title,
  applicantUserId,
  newStatus,
}: {
  requestId: string;
  title: string;
  applicantUserId: string;
  newStatus: string;
}) {
  const label = STATUS_LABELS[newStatus] || newStatus.replace(/_/g, " ");
  await db.activityLog.create({
    data: {
      userId: applicantUserId,
      giftRequestId: requestId,
      action: "Request Status Updated",
      details: `Your request "${title}" has moved to: ${label}.`,
      isRead: false,
    },
  });
}

export async function notifyDecisionExtractIssued({
  requestId,
  title,
  applicantUserId,
  issuedByStage,
}: {
  requestId: string;
  title: string;
  applicantEmail: string | null;
  applicantUserId: string;
  issuedByStage: string;
  extractUrl: string;
}) {
  const issuer = issuedByStage === "senate" ? "Senate" : issuedByStage;
  const advancementIds = await getUserIdsByRole(Role.ADVANCEMENT_OFFICE);

  const rows = [
    {
      userId: applicantUserId,
      details: `${issuer} issued a Decision Extract for "${title}". Please review and submit your department's response.`,
    },
    ...advancementIds.map((userId) => ({
      userId,
      details: `${issuer} issued a Decision Extract for "${title}" to the department. For your records -- no action required.`,
    })),
  ];

  await db.activityLog.createMany({
    data: rows.map((r) => ({
      userId: r.userId,
      giftRequestId: requestId,
      action: "Decision Extract Issued",
      details: r.details,
      isRead: false,
    })),
  });
}

export async function notifyFinalApproval({
  requestId,
  title,
  applicantUserId,
}: {
  requestId: string;
  title: string;
  applicantUserId: string;
  extractUrl?: string | null;
}) {
  const advancementIds = await getUserIdsByRole(Role.ADVANCEMENT_OFFICE);
  const senateIds = await getUserIdsByRole(Role.SENATE_DIVISION);

  const recipientIds = Array.from(new Set([applicantUserId, ...advancementIds, ...senateIds]));

  await db.activityLog.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      giftRequestId: requestId,
      action: "Gift Request Approved",
      details: `"${title}" has received final approval. The process is now complete.`,
      isRead: false,
    })),
  });
}