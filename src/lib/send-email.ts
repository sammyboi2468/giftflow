import "server-only";
import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL =
  process.env.EMAIL_FROM || process.env.SMTP_USER || "GiftFlow <no-reply@giftflow.local>";

// User-supplied text goes into HTML, so escape it.
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function sendAccessRequestEmail(data: {
  name: string;
  email: string;
  department?: string;
  reason?: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return { success: false, error: "ADMIN_EMAIL is not configured." };

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: adminEmail,
      replyTo: data.email, // hitting "Reply" goes to the requester
      subject: `New Access Request: ${data.name}`,
      html: `
        <div style="font-family:sans-serif;line-height:1.5;color:#333;">
          <h2 style="color:#5D5CFF;">New Access Request Received</h2>
          <p>A user has requested access to the <strong>GiftFlow</strong> platform.</p>
          <table style="width:100%;text-align:left;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:bold;width:120px;">Full Name:</td><td>${esc(data.name)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;">Email:</td><td><a href="mailto:${esc(data.email)}">${esc(data.email)}</a></td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;">Department:</td><td>${esc(data.department || "Not provided")}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold;">Reason:</td><td>${esc(data.reason || "Not provided")}</td></tr>
          </table>
          <p style="font-size:12px;color:#777;">You can set up their account via the GiftFlow Admin Dashboard.</p>
        </div>`,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send access request email:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendAppreciationLetterEmail({
  donorEmail,
  donorName,
  title,
  letterUrl,
}: {
  donorEmail: string;
  donorName: string;
  title: string;
  letterUrl: string;
}) {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: donorEmail,
      subject: `Thank you for your generous gift -- ${title}`,
      html: `
        <p>Dear ${esc(donorName)},</p>
        <p>Your gift "${esc(title)}" has been formally approved. Your official
        appreciation letter is attached, and you can also
        <a href="${esc(letterUrl)}">view it online</a>.</p>
        <p>With sincere thanks.</p>`,
      attachments: [
        { filename: "Appreciation-Letter.pdf", path: letterUrl },
      ],
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send appreciation letter email:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}