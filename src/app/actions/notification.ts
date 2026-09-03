// app/actions/notifications.ts
"use server";

import { db } from "@/lib/db"; // Adjust database import path as needed

// app/actions/notification.ts

// app/actions/notification.ts

// app/actions/notification.ts

// app/actions/notification.ts

export async function getUserNotifications(userId?: string) {
  try {
    const whereCondition = userId ? { userId } : {};

    const activityLogs = await db.activityLog.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        giftRequest: true,
      },
    });

    return activityLogs.map((log) => {
      const actionLower = log.action ? log.action.toLowerCase() : "";
      let type = "submitted";
      let title = "Gift Request Update";

      if (actionLower.includes("approved")) {
        type = "approved";
        title = "Gift request approved";
      } else if (actionLower.includes("rejected")) {
        type = "rejected";
        title = "Gift request rejected";
      } else if (actionLower.includes("moved") || actionLower.includes("stage")) {
        type = "moved";
        title = "Request moved to next stage";
      } else if (actionLower.includes("comment")) {
        type = "comment";
        title = "New comment added";
      } else if (actionLower.includes("action") || actionLower.includes("info")) {
        type = "action";
        title = "Action required";
      }

      // 1. Ensure log.notes is strictly treated as a string (if it's not a string, ignore it)
      const rawNotes = typeof log.notes === "string" ? log.notes : "";

      // 2. Build a clean string identifier from giftRequest
      const reqTitle = log.giftRequest?.title;
      const reqId = log.giftRequestId ? `#${log.giftRequestId.slice(-6).toUpperCase()}` : "";
      const reqIdentifier = reqTitle || reqId;

      // 3. Fallback string construction guarantees a pure string
      const descriptionText: string = 
        rawNotes || 
        (reqIdentifier ? `Activity recorded for ${reqIdentifier}` : "New activity recorded");

      return {
        id: log.id,
        title,
        description: descriptionText, // Now strictly typed as string
        createdAt: log.createdAt,
        type,
        isUnread: !log.isRead,
        statusBadge: type === "action" ? "Pending" : null,
      };
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}
export async function markAllNotificationsAsRead(userId?: string) {
  try {
    await db.activityLog.updateMany({
      where: userId ? { userId, isRead: false } : { isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return { success: false };
  }
}