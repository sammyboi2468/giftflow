// Shared notification helpers used by review-actions.ts. Writes to
// ActivityLog -- there is no separate Notification model in the schema;
// this is what getUserNotifications() reads from.

import { db } from "@/lib/db";
import { Role } from "@prisma/client";

async function getUserIdsByRole(role: Role): Promise<string[]> {
  const users = await db.user.findMany({ where: { role }, select: { id: true } });
  return users.map((u) => u.id);
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