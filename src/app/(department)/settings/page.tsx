// app/(dashboard)/settings/page.tsx  (put it wherever your settings route lives)
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import SettingsForm from "@/components/settings-form";

const ROLE_LABEL: Record<Role, string> = {
  DEPARTMENT_USER: "Department User",
  ADVANCEMENT_OFFICE: "Advancement Office",
  SENATE_DIVISION: "Senate Division",
  COUNCIL: "Council",
  ADMIN: "Administrator",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      department: true,
      defaultOriginLevel: true,
      defaultFaculty: true,
      defaultLedgerCode: true,
      notifyRoutineUpdates: true,
    },
  });

  if (!user) redirect("/login");

  // Only roles that can submit gift requests have submission defaults.
  const canSubmit =
    user.role === Role.DEPARTMENT_USER ||
    user.role === Role.ADVANCEMENT_OFFICE ||
    user.role === Role.ADMIN;

  return (
    <SettingsForm
      canSubmit={canSubmit}
      profile={{
        name: user.name ?? "Not set",
        email: user.email,
        roleLabel: ROLE_LABEL[user.role] ?? user.role,
        department: user.department ?? "Not assigned",
      }}
      initial={{
        defaultOriginLevel: user.defaultOriginLevel ?? "",
        defaultFaculty: user.defaultFaculty ?? "",
        defaultLedgerCode: user.defaultLedgerCode ?? "",
        notifyRoutineUpdates: user.notifyRoutineUpdates,
      }}
    />
  );
}