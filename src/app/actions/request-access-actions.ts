'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface RequestAccessPayload {
  name: string;
  email: string;
  department?: string;
  reason?: string;
}

export async function submitAccessRequest(data: RequestAccessPayload) {
  try {
    const { name, email, department, reason } = data;

    if (!name || !email) {
      return { success: false, error: 'Name and email are required.' };
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL is not defined in environment variables.');
      return { success: false, error: 'Server configuration error.' };
    }

    // Send email to admin using Resend
    await resend.emails.send({
      from: 'GiftFlow System <onboarding@resend.dev>', // Update to your verified domain once live
      to: adminEmail,
      subject: `New Access Request: ${name}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
          <h2 style="color: #5D5CFF;">New Access Request Received</h2>
          <p>A user has requested access to the <strong>GiftFlow</strong> platform.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Full Name:</td>
              <td style="padding: 8px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Department:</td>
              <td style="padding: 8px 0;">${department || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Reason:</td>
              <td style="padding: 8px 0;">${reason || 'Not provided'}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777;">You can set up their account via the GiftFlow Admin Dashboard.</p>
        </div>
      `,
    });

    // Optional: Also save the request to Prisma DB here if you maintain an AccessRequest table
    /*
    await prisma.accessRequest.create({
      data: { name, email, department, reason }
    });
    */

    return { success: true };
  } catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
  console.error(errorMessage);
  return { success: false, error: errorMessage };
}}