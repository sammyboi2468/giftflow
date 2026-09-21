"use server";

import { db } from "@/lib/db";

interface SubmitAccessRequestInput {
  name: string;
  email: string;
  department?: string;
  reason?: string;
}

export async function submitAccessRequest({
  name,
  email,
  department,
  reason,
}: SubmitAccessRequestInput) {
  try {
    if (!name.trim() || !email.trim()) {
      return { success: false, error: "Name and email are required." };
    }

    await db.accessRequest.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        department: department?.trim() || null,
        reason: reason?.trim() || null,
      },
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("Access request error:", err);
    return { success: false, error: "Failed to submit request. Please try again." };
  }
}