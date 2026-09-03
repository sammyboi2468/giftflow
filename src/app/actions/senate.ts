'use server';

import { revalidatePath } from 'next/cache';
import { RequestStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * Fetch all requests relevant to Senate (including SENATE_PROCESSING)
 */
export async function getSenateRequests() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const requests = await db.giftRequest.findMany({
      where: {
        status: {
          in: [
            RequestStatus.SENATE_REVIEW,
            RequestStatus.SENATE_PROCESSING,
            RequestStatus.AWAITING_DEPARTMENT_RESPONSE,
          ],
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: true,
          },
        },
        documents: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { author: true },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return requests;
  } catch (error) {
    console.error('Error fetching Senate requests:', error);
    return [];
  }
}

/**
 * Action: Issue Decision Extract to Department
 */
export async function issueSenateDecisionExtract(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized.' };
    }

    const requestId = formData.get('requestId') as string;
    const documentUrl = formData.get('documentUrl') as string;
    const fileName = (formData.get('fileName') as string) || 'Senate_Decision_Extract.pdf';
    const notes = (formData.get('notes') as string) || 'Senate issued decision extract for department response.';

    if (!requestId || !documentUrl) {
      return { success: false, error: 'Request ID and Extract Document URL are required.' };
    }

    await db.$transaction([
      db.giftRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.AWAITING_DEPARTMENT_RESPONSE,
          decisionExtractUrl: documentUrl,
        },
      }),

      db.giftDocument.create({
        data: {
          giftRequestId: requestId,
          docType: 'DECISION_EXTRACT',
          fileName: fileName,
          fileUrl: documentUrl,
          fileSize: 0,
        },
      }),

      db.activityLog.create({
        data: {
          giftRequestId: requestId,
          userId: session.user.id,
          action: 'SENATE_EXTRACT_ISSUED',
          details: 'Senate issued decision extract. Awaiting Department response.',
          notes,
        },
      }),
    ]);

    revalidatePath('/dashboard');
    revalidatePath('/reviewer/senate');
    revalidatePath('/reviewer/advancement');

    return { success: true };
  } catch (error) {
    console.error('Error issuing Senate decision extract:', error);
    return { success: false, error: 'Failed to issue decision extract.' };
  }
}

/**
 * Action: Forward Request from Senate (or Senate Processing) to Council
 */
export async function forwardSenateRequestToCouncil(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized.' };
    }

    const requestId = formData.get('requestId') as string;
    const notes = (formData.get('notes') as string) || 'Senate approved department response and forwarded request to Council.';

    if (!requestId) {
      return { success: false, error: 'Request ID is required.' };
    }

    // Verify request exists and is in a valid Senate status
    const existing = await db.giftRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      return { success: false, error: 'Gift request not found.' };
    }

    if (
      existing.status !== RequestStatus.SENATE_REVIEW &&
      existing.status !== RequestStatus.SENATE_PROCESSING
    ) {
      return {
        success: false,
        error: 'Request must be under Senate Review or Senate Processing before forwarding to Council.',
      };
    }

    await db.$transaction([
      // 1. Update status to COUNCIL_REVIEW
      db.giftRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.COUNCIL_REVIEW,
        },
      }),

      // 2. Log transfer to Council
      db.activityLog.create({
        data: {
          giftRequestId: requestId,
          userId: session.user.id,
          action: 'FORWARDED_TO_COUNCIL',
          details: 'Senate processed Department response and forwarded request to Council for final approval.',
          notes,
        },
      }),
    ]);

    revalidatePath('/dashboard');
    revalidatePath('/reviewer/senate');
    revalidatePath('/reviewer/council');
    revalidatePath('/reviewer/advancement');

    return { success: true };
  } catch (error) {
    console.error('Error forwarding to Council:', error);
    return { success: false, error: 'Failed to forward request to Council.' };
  }
}