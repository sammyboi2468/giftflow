'use server';

import { revalidatePath } from 'next/cache';
import { db as prisma } from '@/lib/db';
import { Role, RequestStatus } from '@prisma/client';

/**
 * Fetch pending gift requests for a specific reviewer stage
 */
export async function getPendingReviews(stageRole: Role) {
  try {
    return await prisma.giftRequest.findMany({
      where: {
        currentStage: stageRole,
        status: {
          in: [RequestStatus.SUBMITTED, RequestStatus.PENDING],
        },
      },
      include: {
        user: true,
        documents: true,
        activityLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to fetch pending reviews:', error);
    return [];
  }
}

/**
 * Approve and move request to the next review tier
 */
export async function approveAndPromoteRequest({
  requestId,
  reviewerId,
  reviewerRole,
  notes,
}: {
  requestId: string;
  reviewerId: string;
  reviewerRole: Role;
  notes?: string;
}) {
  try {
    let nextStage: Role = reviewerRole;
    let newStatus: RequestStatus = RequestStatus.SUBMITTED;

    // Determine stage promotion flow
    if (reviewerRole === Role.ADVANCEMENT_OFFICE) {
      nextStage = Role.SENATE_DIVISION;
    } else if (reviewerRole === Role.SENATE_DIVISION) {
      nextStage = Role.COUNCIL;
    } else if (reviewerRole === Role.COUNCIL) {
      newStatus = RequestStatus.APPROVED; // Final Approval
    }

    await prisma.$transaction([
      prisma.giftRequest.update({
        where: { id: requestId },
        data: {
          currentStage: nextStage,
          status: newStatus,
        },
      }),
      prisma.activityLog.create({
        data: {
          giftRequestId: requestId,
          userId: reviewerId,
          action: `APPROVED_BY_${reviewerRole}`,
          details: `Approved by ${reviewerRole.replace('_', ' ')}. Promoted to ${nextStage.replace('_', ' ')}.`,
          notes: notes || null,
        },
      }),
    ]);

    revalidatePath('/reviewer');
    return { success: true, message: 'Request approved and moved to the next stage!' };
  } catch (error) {
    console.error('Approve action error:', error);
    return { success: false, message: 'Failed to approve proposal.' };
  }
}

/**
 * Request revisions from applicant
 */
export async function requestRevision({
  requestId,
  reviewerId,
  reviewerRole,
  feedback,
}: {
  requestId: string;
  reviewerId: string;
  reviewerRole: Role;
  feedback: string;
}) {
  try {
    await prisma.$transaction([
      prisma.giftRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.REVISION_REQUESTED,
        },
      }),
      prisma.activityLog.create({
        data: {
          giftRequestId: requestId,
          userId: reviewerId,
          action: `REVISION_REQUESTED_BY_${reviewerRole}`,
          details: `Revision requested by ${reviewerRole.replace('_', ' ')}.`,
          notes: feedback,
        },
      }),
    ]);

    revalidatePath('/reviewer');
    return { success: true, message: 'Revision request sent back to the applicant.' };
  } catch (error) {
    console.error('Revision action error:', error);
    return { success: false, message: 'Failed to submit revision request.' };
  }
}

/**
 * Reject proposal
 */
export async function rejectRequest({
  requestId,
  reviewerId,
  reviewerRole,
  reason,
}: {
  requestId: string;
  reviewerId: string;
  reviewerRole: Role;
  reason: string;
}) {
  try {
    await prisma.$transaction([
      prisma.giftRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.REJECTED,
        },
      }),
      prisma.activityLog.create({
        data: {
          giftRequestId: requestId,
          userId: reviewerId,
          action: `REJECTED_BY_${reviewerRole}`,
          details: `Rejected by ${reviewerRole.replace('_', ' ')}.`,
          notes: reason,
        },
      }),
    ]);

    revalidatePath('/reviewer');
    return { success: true, message: 'Proposal has been rejected.' };
  } catch (error) {
    console.error('Reject action error:', error);
    return { success: false, message: 'Failed to reject proposal.' };
  }
}