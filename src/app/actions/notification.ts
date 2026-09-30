// app/actions/notifications.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { RequestStatus, Role } from "@prisma/client";

const STAGE_FOR_ROLE: Partial<Record<Role, string>> = {
  [Role.ADVANCEMENT_OFFICE]: "advancement",
  [Role.SENATE_DIVISION]: "senate",
  [Role.COUNCIL]: "council",
};

const QUEUE_STATUSES: Partial<Record<Role, RequestStatus[]>> = {
  [Role.ADVANCEMENT_OFFICE]: [RequestStatus.ADVANCEMENT_REVIEW],
  [Role.SENATE_DIVISION]: [RequestStatus.SENATE_REVIEW, RequestStatus.SENATE_PROCESSING],
  [Role.COUNCIL]: [RequestStatus.COUNCIL_REVIEW],
};

// action (written by lib/notify.ts) -> UI type + title.
// "Request Status Updated" is what older rows were saved with.
const META: Record<string, { type: string; title: string }> = {
  "Gift Request Approved": { type: "approved", title: "Gift request approved" },
  "Request Rejected": { type: "rejected", title: "Gift request rejected" },
  "Request Moved": { type: "moved", title: "Request moved to next stage" },
  "Request Status Updated": { type: "moved", title: "Request moved to next stage" },
  "Request Resubmitted": { type: "moved", title: "Request resubmitted" },
  "Department Responded": { type: "moved", title: "Department responded" },
  "Revision Requested": { type: "action", title: "More information requested" },
  "Decision Extract Issued": { type: "action", title: "Decision Extract issued" },
};

function hrefFor(
  req: { id: string; userId: string; status: RequestStatus } | null,
  userId: string,
  role?: Role
) {
  if (!req) return "/dashboard";

  // The sender's to-do items.
  if (req.userId === userId) {
    if (req.status === RequestStatus.REVISION_REQUESTED) return `/requestform?draftId=${req.id}`;
    if (req.status === RequestStatus.AWAITING_DEPARTMENT_RESPONSE) return `/reviewer/department/${req.id}`;
  }

  // A reviewer whose queue currently holds the request.
  const stage = role ? STAGE_FOR_ROLE[role] : undefined;
  if (stage && role && QUEUE_STATUSES[role]?.includes(req.status)) {
    const segment = req.status === RequestStatus.SENATE_PROCESSING ? "senate-processing" : stage;
    return `/reviewer/${segment}/${req.id}`;
  }

  return stage ? `/reviewer/${stage}/history` : "/dashboard";
}

// The optional argument is ignored on purpose: notifications are always
// scoped to the signed-in user, never to a client-supplied id.
export async function getUserNotifications(_userId?: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    const role = session.user.role as Role | undefined;

    const logs = await db.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { giftRequest: { select: { id: true, userId: true, status: true } } },
    });

    return logs.map((log) => {
      const meta = META[log.action ?? ""] ?? { type: "submitted", title: "Gift request update" };
      const req = log.giftRequest;

      // "Pending" only while the sender still has something to do; it
      // disappears once they've acted.
      const stillActionable =
        !!req &&
        req.userId === userId &&
        (req.status === RequestStatus.REVISION_REQUESTED ||
          req.status === RequestStatus.AWAITING_DEPARTMENT_RESPONSE);

      return {
        id: log.id,
        title: meta.title,
        description: log.details || "New activity recorded",
        createdAt: log.createdAt,
        type: meta.type,
        kind: log.action,
        isUnread: !log.isRead,
        statusBadge: meta.type === "action" && stillActionable ? "Pending" : null,
        href: hrefFor(req, userId, role),
      };
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false };
    await db.activityLog.updateMany({
      where: { id, userId: session.user.id },
      data: { isRead: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead(_userId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false };
    await db.activityLog.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return { success: false };
  }
}