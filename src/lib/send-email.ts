import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendAppreciationLetterInput {
  donorEmail: string;
  donorName: string;
  title: string;
  letterUrl: string;
}

export async function sendAppreciationLetterEmail({
  donorEmail,
  donorName,
  title,
  letterUrl,
}: SendAppreciationLetterInput) {
  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: donorEmail, // <-- Delivered directly to ANY external donor email!
      subject: `Letter of Appreciation: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #5D5CFF;">Dear ${donorName},</h2>
          
          <p>
            On behalf of the institution, we extend our heartfelt gratitude for your generous support and contribution towards <strong>"${title}"</strong>.
          </p>

          <p>
            Your gift has been formally accepted and processed through our council review. We have attached an official Letter of Appreciation for your records.
          </p>

          <div style="margin: 30px 0; text-align: center;">
            <a 
              href="${letterUrl}" 
              target="_blank" 
              style="background-color: #5D5CFF; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;"
            >
              Download Appreciation Letter (PDF)
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            If the button above does not work, copy and paste this link into your browser:<br />
            <a href="${letterUrl}" style="color: #5D5CFF;">${letterUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="font-size: 12px; color: #888;">
            This is an automated message from the GiftFlow management system.
          </p>
        </div>
      `,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error sending email";
    console.error("Error in sendAppreciationLetterEmail:", errorMessage);
    return { success: false, error: errorMessage };
  }
}