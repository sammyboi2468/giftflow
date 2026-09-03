'use server';

import { revalidatePath } from 'next/cache';
import { RequestStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// --- HELPER FUNCTIONS ---

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function cleanCuid(id: string | null): string | null {
  if (!id) return null;
  // Clean query param artifacts while keeping standard CUIDs/NanoIDs intact
  const sanitized = id.replace(/[?&].*$/, '').trim();
  return sanitized.length >= 10 ? sanitized : null;
}

// --- SERVER ACTIONS ---

/**
 * Action 1: Create or update and submit a complete Gift Request
 */
export async function createGiftRequest(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    // Fall back to 'draftId' if 'requestId' is missing
    const rawRequestId = (formData.get('requestId') || formData.get('draftId')) as string | null;
    const requestId = cleanCuid(rawRequestId);

    const title = formData.get('title') as string;
    const donorName = formData.get('donorName') as string;
    const department = formData.get('department') as string;
    const purpose = formData.get('purpose') as string;
    const giftType = formData.get('giftType') as string;
    const currency = formData.get('currency') as string;
    const rawAmount = formData.get('amount') as string;

    const amount = rawAmount && !isNaN(Number(rawAmount)) ? parseFloat(rawAmount) : null;

    const docTypes = formData.getAll('docTypes[]') as string[];
    const fileUrls = formData.getAll('fileUrls[]') as string[];
    const fileNames = formData.getAll('fileNames[]') as string[];
    const fileSizes = formData.getAll('fileSizes[]') as string[];

    const documentsToCreate = docTypes
      .map((docType, index) => ({
        docType,
        fileUrl: fileUrls[index],
        fileName: fileNames[index] || 'Untitled Document',
        fileSize: fileSizes[index] ? parseInt(fileSizes[index], 10) : 0,
      }))
      .filter((doc) => doc.fileUrl);

    const payload = {
      title,
      donorName,
      department,
      purpose,
      giftType,
      currency,
      amount,
      userId: session.user.id,
      status: RequestStatus.ADVANCEMENT_REVIEW,
    };

    let record;

    if (requestId) {
      await db.giftDocument.deleteMany({
        where: { giftRequestId: requestId },
      });

      record = await db.giftRequest.update({
        where: { id: requestId, userId: session.user.id },
        data: {
          ...payload,
          documents: {
            create: documentsToCreate,
          },
        },
      });
    } else {
      record = await db.giftRequest.create({
        data: {
          ...payload,
          documents: {
            create: documentsToCreate,
          },
        },
      });
    }

    revalidatePath('/dashboard');
    revalidatePath(`/reviewer/advancement/${record.id}`);

    return { success: true, requestId: record.id };
  } catch (error) {
    console.error('Error submitting gift request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit gift request.',
    };
  }
}

/**
 * Action 2: Save or update a draft (allows partial input)
 */
export async function saveGiftRequestDraft(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fall back to 'draftId' if 'requestId' is missing
    const rawRequestId = (formData.get('draftId') || formData.get('requestId')) as string | null;
    const requestId = cleanCuid(rawRequestId);

    const title = (formData.get('title') as string) || 'Untitled Draft';
    const donorName = (formData.get('donorName') as string) || '';
    const giftType = (formData.get('giftType') as string) || 'Prize';
    const department = (formData.get('department') as string) || '';
    const purpose = (formData.get('purpose') as string) || '';
    const currency = (formData.get('currency') as string) || 'NGN';

    const rawAmount = formData.get('amount') as string;
    const amount = rawAmount && !isNaN(Number(rawAmount)) ? Number(rawAmount) : null;
    const hasConflict = formData.get('hasConflict') === 'true';

    // Verify existing record safely
    let existingRecord = null;
    if (requestId) {
      existingRecord = await db.giftRequest.findUnique({
        where: { id: requestId, userId: session.user.id },
      });
    }

    if (existingRecord) {
      const updated = await db.giftRequest.update({
        where: { id: existingRecord.id, userId: session.user.id },
        data: {
          title,
          donorName,
          giftType,
          department,
          amount,
          currency,
          purpose,
          hasConflictOfInterest: hasConflict,
        },
      });
      return { success: true, draftId: updated.id };
    } else {
      const newDraft = await db.giftRequest.create({
        data: {
          title,
          donorName,
          giftType,
          department,
          amount,
          currency,
          purpose,
          hasConflictOfInterest: hasConflict,
          status: RequestStatus.DRAFT,
          userId: session.user.id,
        },
      });

      return { success: true, draftId: newDraft.id };
    }
  } catch (error) {
    console.error('Failed in saveGiftRequestDraft:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Action 3: Delete a draft request with authorization checks
 */
export async function deleteGiftRequestDraft(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const cleanId = cleanCuid(requestId);
    if (!cleanId) {
      return { success: false, error: 'Invalid draft ID.' };
    }

    const result = await db.giftRequest.deleteMany({
      where: {
        id: cleanId,
        userId: session.user.id,
        status: RequestStatus.DRAFT,
      },
    });

    if (result.count === 0) {
      return { success: false, error: 'Draft not found or unauthorized to delete.' };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting draft:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Action 4: Fetch requests for the currently authenticated user
 */
export async function getUserGiftRequests(draftId?: string) {
  try {
    const cleanId = cleanCuid(draftId ?? null);

    // 1. If cleanId is provided, fetch single request (for edit/view forms)
    if (cleanId) {
      const draft = await db.giftRequest.findUnique({
        where: { id: cleanId },
        include: { 
          documents: true,
          comments: { orderBy: { createdAt: 'desc' } },
          activityLogs: { orderBy: { createdAt: 'desc' } }
        },
      });
      return draft;
    }

    // 2. If no draftId, fetch ALL requests belonging to the authenticated department user
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const requests = await db.giftRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' }, // Sort by updatedAt so recently updated extracts appear at the top
      include: { 
        documents: true,
        comments: { orderBy: { createdAt: 'desc' } },
        activityLogs: { orderBy: { createdAt: 'desc' } }
      },
    });

    return requests;
  } catch (error) {
    console.error('Error fetching gift request:', error);
    return []; // Return empty array on error so UI doesn't crash on .map()
  }
}
/**
 * Action 5: Get report data filtered by timeframe
 */
export async function getDepartmentReportData(
  timeframe: 'This Month' | 'This Quarter' | 'This Year' = 'This Quarter'
) {
  try {
    const now = new Date();
    let startDate = new Date();

    if (timeframe === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeframe === 'This Quarter') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterMonth, 1);
    } else if (timeframe === 'This Year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const requests = await db.giftRequest.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  } catch (error) {
    console.error('Failed to fetch report data:', error);
    return [];
  }
}

/**
 * Action 6: Resubmit a revised gift request along with an activity log entry
 */
export async function resubmitGiftRequest(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const rawRequestId = (formData.get('requestId') || formData.get('draftId')) as string;
    const requestId = cleanCuid(rawRequestId);

    const userId = session.user.id;

    if (!requestId) {
      return { success: false, error: 'Valid Request ID is required for resubmission.' };
    }

    const existing = await db.giftRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) return { success: false, error: 'Gift request not found.' };
    if (existing.userId !== userId) return { success: false, error: 'Unauthorized to revise this request.' };
    if (existing.status !== RequestStatus.REVISION_REQUESTED) {
      return { success: false, error: 'Only requests with status "REVISION_REQUESTED" can be resubmitted.' };
    }

    const title = (formData.get('title') as string) || existing.title;
    const purpose = (formData.get('purpose') as string) || existing.purpose;
    const amount = formData.get('amount') ? Number(formData.get('amount')) : existing.amount;

    await db.$transaction([
      db.giftRequest.update({
        where: { id: requestId },
        data: {
          title,
          purpose,
          amount,
          status: RequestStatus.ADVANCEMENT_REVIEW,
        },
      }),
      db.activityLog.create({
        data: {
          giftRequestId: requestId,
          userId,
          action: 'REVISION_RESUBMITTED',
          details: 'Applicant revised and resubmitted proposal specs.',
          notes:
            (formData.get('notes') as string) ||
            'Resubmitted with updated budget and justification.',
        },
      }),
    ]);

    revalidatePath('/dashboard');
    revalidatePath('/reviewer');

    return { success: true, message: 'Proposal resubmitted successfully!' };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}