import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { RequestStatus } from '@prisma/client';

// Forces dynamic rendering so every visit re-queries the database instead of
// serving a build-time snapshot.
export const dynamic = 'force-dynamic';

export default async function DraftsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Fetch draft proposals belonging to the current user only.
  const drafts = await prisma.giftRequest.findMany({
    where: {
      userId: session.user.id,
      status: RequestStatus.DRAFT,
    },
    include: {
      documents: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Saved Drafts</h1>
          <p className="text-sm text-slate-500">Resume incomplete gift request proposals.</p>
        </div>
        <Link
          href="/requestform"
          className="inline-flex items-center justify-center px-4 py-2.5 sm:py-2 bg-[#5D5CFF] text-white text-xs font-bold rounded-lg hover:bg-[#4d4ce0] transition-colors"
        >
          + New Request
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <p className="text-slate-600 font-semibold text-base">No saved drafts found</p>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            When you save an incomplete proposal, it will appear here so you can finish it later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:border-slate-300 transition-all shadow-xs"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                    DRAFT
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm break-words">
                    {draft.title || 'Untitled Draft'}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>Donor: {draft.donorName || 'Not specified'}</span>
                  <span aria-hidden="true" className="hidden sm:inline">•</span>
                  <span>
                    Amount: {draft.amount ? `${draft.currency || 'NGN'} ${Number(draft.amount).toLocaleString()}` : 'Not set'}
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline">•</span>
                  <span>Files: {draft.documents.length} uploaded</span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Last updated: {new Date(draft.updatedAt).toLocaleString()}
                </p>
              </div>

              <Link
                href={`/requestform?draftId=${draft.id}`}
                className="inline-flex shrink-0 items-center justify-center px-4 py-2.5 sm:py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Continue Proposal
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}