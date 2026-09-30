// app/actions/settings.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ORIGIN_LEVELS = ["DEPARTMENT", "FACULTY", "ADVANCEMENT_OFFICE", "UNIVERSITY"] as const;

export interface SettingsInput {
  defaultOriginLevel: string;
  defaultFaculty: string;
  defaultLedgerCode: string;
  notifyRoutineUpdates: boolean;
}

export async function updateSettings(input: SettingsInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "You need to sign in again." };

    const originLevel = input.defaultOriginLevel.trim();
    const faculty = input.defaultFaculty.trim();
    const ledgerCode = input.defaultLedgerCode.trim();

    if (originLevel && !(ORIGIN_LEVELS as readonly string[]).includes(originLevel)) {
      return { success: false, error: "Choose a valid origin level." };
    }
    if (faculty.length > 120) return { success: false, error: "Faculty name is too long." };
    if (ledgerCode.length > 40) return { success: false, error: "Ledger code is too long." };

    // Only these four fields can ever be changed from this page. Name, email,
    // role and department are deliberately not accepted: department controls
    // which requests a user can see, so only an administrator may change it.
    await db.user.update({
      where: { id: session.user.id },
      data: {
        defaultOriginLevel: originLevel || null,
        defaultFaculty: faculty || null,
        defaultLedgerCode: ledgerCode || null,
        notifyRoutineUpdates: !!input.notifyRoutineUpdates,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("updateSettings failed:", err);
    return { success: false, error: "Could not save your settings. Please try again." };
  }
}