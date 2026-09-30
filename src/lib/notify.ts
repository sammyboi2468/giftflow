// lib/notify.ts
// Shared notification helpers used by review-actions.ts. Writes to
// ActivityLog (userId = the RECIPIENT); getUserNotifications() reads from it.

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

// Which role works the queue a status belongs to.
const QUEUE_ROLE: Record<string, Role> = {
  ADVANCEMENT_REVIEW: Role.ADVANCEMENT_OFFICE,
  SENATE_REVIEW: Role.SENATE_DIVISION,
  SENATE_PROCESSING: Role.SENATE_DIVISION,
  COUNCIL_REVIEW: Role.COUNCIL,
};

// `action` values are what getUserNotifications() keys on to pick an icon.
// Keep them in sync with META in app/actions/notifications.ts.
export const NOTIFY_ACTION = {
  MOVED: "Request Moved",
  RESUBMITTED: "Request Resubmitted",
  DEPARTMENT_RESPONDED: "Department Responded",
  INFO_REQUESTED: "Revision Requested",
  REJECTED: "Request Rejected",
  EXTRACT_ISSUED: "Decision Extract Issued",
  APPROVED: "Gift Request Approved",
} as const;

type Audience = "owner" | "queue" | "participant";

function classify(from: string | null | undefined, to: string) {
  if (to === "REJECTED") return NOTIFY_ACTION.REJECTED;
  if (to === "REVISION_REQUESTED") return NOTIFY_ACTION.INFO_REQUESTED;
  if (to === "SENATE_PROCESSING") return NOTIFY_ACTION.DEPARTMENT_RESPONDED;
  if (from === "REVISION_REQUESTED" && QUEUE_ROLE[to]) return NOTIFY_ACTION.RESUBMITTED;
  return NOTIFY_ACTION.MOVED;
}

function describe(action: string, audience: Audience, title: string, to: string, comment?: string | null) {
  const note = comment?.trim() ? ` Reviewer note: ${comment.trim().slice(0, 200)}` : "";
  const label = STATUS_LABELS[to] || to.replace(/_/g, " ");

  switch (action) {
    case NOTIFY_ACTION.REJECTED:
      return `"${title}" was rejected.${note}`;
    case NOTIFY_ACTION.INFO_REQUESTED:
      return audience === "owner"
        ? `Action required: a reviewer sent "${title}" back for revision.${note}`
        : `More information was requested for "${title}".${note}`;
    case NOTIFY_ACTION.DEPARTMENT_RESPONDED:
      return audience === "queue"
        ? `The department responded to the Decision Extract for "${title}". It is awaiting your review.`
        : `"${title}" is back with the Senate for final processing.`;
    case NOTIFY_ACTION.RESUBMITTED:
      return audience === "queue"
        ? `"${title}" was revised and resubmitted. It is awaiting your review.`
        : `"${title}" was resubmitted and has moved to: ${label}.`;
    default:
      return audience === "queue"
        ? `"${title}" is awaiting your review.`
        : `Your request "${title}" has moved to: ${label}.`;
  }
}

// General "the request changed stage" notice. Used for every transition not
// covered by a more specific notifier below (decision extract, final
// approval). Notifies:
//   - the applicant, always
//   - everyone who works the queue the request just entered
//   - for rejections and info requests, every stage that already handled it
// Routine updates (moves, resubmissions, department responses) respect each
// user's "Routine stage updates" setting. Rejections and info requests are
// never suppressed.
// The optional fields are backwards compatible: existing callers still work.
export async function notifyStatusChange({
  requestId,
  title,
  applicantUserId,
  newStatus,
  fromStatus,
  actorId,
  comment,
}: {
  requestId: string;
  title: string;
  applicantUserId: string;
  newStatus: string;
  fromStatus?: string | null;
  actorId?: string;
  comment?: string | null;
}) {
  try {
    const action = classify(fromStatus, newStatus);

    const audience = new Map<string, Audience>();
    audience.set(applicantUserId, "owner");

    const queueRole = QUEUE_ROLE[newStatus];
    if (queueRole) {
      for (const id of await getUserIdsByRole(queueRole)) {
        if (!audience.has(id)) audience.set(id, "queue");
      }
    }

    if (action === NOTIFY_ACTION.REJECTED || action === NOTIFY_ACTION.INFO_REQUESTED) {
      const history = await db.stageHistory.findMany({
        where: { giftRequestId: requestId },
        select: { actedByUserId: true },
        distinct: ["actedByUserId"],
      });
      for (const h of history) {
        if (h.actedByUserId && !audience.has(h.actedByUserId)) audience.set(h.actedByUserId, "participant");
      }
    }

    // The person who made the change doesn't need telling.
    if (actorId) audience.delete(actorId);

    // Drop anyone who turned routine updates off in Settings.
    const routine =
      action === NOTIFY_ACTION.MOVED ||
      action === NOTIFY_ACTION.RESUBMITTED ||
      action === NOTIFY_ACTION.DEPARTMENT_RESPONDED;

    if (routine && audience.size > 0) {
      const optedOut = await db.user.findMany({
        where: { id: { in: [...audience.keys()] }, notifyRoutineUpdates: false },
        select: { id: true },
      });
      for (const u of optedOut) audience.delete(u.id);
    }

    if (audience.size === 0) return;

    await db.activityLog.createMany({
      data: [...audience].map(([userId, aud]) => ({
        userId,
        giftRequestId: requestId,
        action,
        details: describe(action, aud, title, newStatus, comment),
        isRead: false,
      })),
    });
  } catch (err) {
    // A notification problem must never fail the workflow step.
    console.error("notifyStatusChange failed:", err);
  }
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
      action: NOTIFY_ACTION.EXTRACT_ISSUED,
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
      action: NOTIFY_ACTION.APPROVED,
      details: `"${title}" has received final approval. The process is now complete.`,
      isRead: false,
    })),
  });
}