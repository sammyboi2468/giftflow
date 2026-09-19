import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { RequestStatus, Role } from "@prisma/client";
import { Clock3, ShieldCheck, History } from "lucide-react";
import Link from "next/link";
import ApplicationsList, { OldestPendingStat } from "@/components/application-list/page";

// Map URL stage param to database RequestStatus
const STAGE_STATUS_MAP: Record<string, RequestStatus> = {
  advancement: RequestStatus.ADVANCEMENT_REVIEW,
  senate: RequestStatus.SENATE_REVIEW,
  "senate-processing": RequestStatus.SENATE_PROCESSING,
  council: RequestStatus.COUNCIL_REVIEW,
};

// Map URL stage param to authorized user Role requirement
const STAGE_ROLE_MAP: Record<string, Role> = {
  advancement: Role.ADVANCEMENT_OFFICE,
  senate: Role.SENATE_DIVISION,
  "senate-processing": Role.SENATE_DIVISION,
  council: Role.COUNCIL,
};

export default async function ReviewerStagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage } = await params;
  const session = await auth();

  if (!session?.user) redirect("/login");

  const normalizedStage = stage.toLowerCase();
  const targetStatus = STAGE_STATUS_MAP[normalizedStage];

  if (!targetStatus) notFound();

  // 🔒 RBAC Access Control Guard
  const userRole = session.user.role as Role | undefined;

  // Block base department users from entering any reviewer portal
  if (!userRole || userRole === Role.DEPARTMENT_USER) {
    redirect("/login");
  }

  // Restrict access strictly to designated stage role (unless user is ADMIN)
  const requiredRole = STAGE_ROLE_MAP[normalizedStage];
  if (userRole !== Role.ADMIN && userRole !== requiredRole) {
    redirect("/login");
  }

  // The "senate" view covers the whole senate workflow in one place: fresh
  // items awaiting initial review (SENATE_REVIEW) and items that came back
  // from the department and need final senate processing (SENATE_PROCESSING).
  const statusFilter =
    normalizedStage === "senate"
      ? { in: [RequestStatus.SENATE_REVIEW, RequestStatus.SENATE_PROCESSING] }
      : targetStatus;

  // Fetch applications pending for this specific stage
  const applications = await db.giftRequest.findMany({
    where: { status: statusFilter },
    include: {
      user: { select: { name: true, department: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const isSenate = normalizedStage === "senate" || normalizedStage === "senate-processing";
  const isCouncil = normalizedStage === "council";

  // Oldest item in the queue -- applications are ordered newest first, so
  // the last entry has been waiting the longest. The raw date is picked
  // here (pure); "how many days ago" is computed client-side, in
  // OldestPendingStat, since that requires reading the current time.
  const oldestCreatedAt = applications.length > 0 ? applications[applications.length - 1].createdAt : null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans sm:p-8 lg:p-12">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8">
          <ShieldCheck
            className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 text-white/10"
            strokeWidth={1}
          />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <Clock3 className="h-3.5 w-3.5" />
                Active review portal
              </span>
              <h1 className="mt-3 text-2xl font-bold capitalize text-white">
                {stage.replace("-", " ")} office review
              </h1>
              <p className="mt-1 text-sm text-indigo-100">
                Logged in as <span className="font-semibold text-white">{session.user.name}</span>{" "}
                ({session.user.department || userRole})
              </p>
              <Link
                href={`/reviewer/${stage}/history`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              >
                <History className="h-3.5 w-3.5" />
                View Full History
              </Link>
            </div>

            <div className="flex shrink-0 gap-6 rounded-xl bg-white/10 px-6 py-4">
              <div>
                <span className="text-3xl font-extrabold text-white">{applications.length}</span>
                <p className="text-xs font-medium text-indigo-100">Applications pending</p>
              </div>
              <OldestPendingStat oldestCreatedAt={oldestCreatedAt} />
            </div>
          </div>
        </div>

        {/* Applications List */}
        <ApplicationsList
          applications={applications}
          stage={stage}
          isSenate={isSenate}
          isCouncil={isCouncil}
        />
      </div>
    </div>
  );
}