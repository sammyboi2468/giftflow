'use server';

import { sendAccessRequestEmail } from '@/lib/send-email';

interface RequestAccessPayload {
  name: string;
  email: string;
  department?: string;
  reason?: string;
}

export async function submitAccessRequest(data: RequestAccessPayload) {
  const name = data.name?.trim();
  const email = data.email?.trim();

  if (!name || !email) {
    return { success: false, error: 'Name and email are required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const result = await sendAccessRequestEmail({
    name,
    email,
    department: data.department?.trim(),
    reason: data.reason?.trim(),
  });

  if (!result.success) {
    console.error('Access request email failed:', result.error);
    // Don't leak SMTP details to the browser
    return { success: false, error: 'Could not send your request. Please try again later.' };
  }

  return { success: true };
}