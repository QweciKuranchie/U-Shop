import { resend } from "./resend";

export async function sendVerificationEmail({ to, url }: { to: string; url: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.ushopgh.com";
  const logoUrl = `${appUrl}/logo.png`;

  await resend.emails.send({
    from: "U-Shop <noreply@ushopgh.com>",
    to,
    subject: "Verify your email address - U-Shop",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <img src="${logoUrl}" alt="U-Shop Logo" style="height: 40px; width: auto;" />
        </div>
        <h2 style="color: #5D1A89; margin-bottom: 16px; text-align: center;">Verify your U-Shop Account</h2>
        <p style="color: #374151; line-height: 1.5; margin-bottom: 24px;">
          Thank you for signing up for U-Shop! Please click the button below to verify your email address and activate your account:
        </p>
        <div style="margin-bottom: 24px; text-align: center;">
          <a href="${url}" style="background-color: #5D1A89; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
          If the button above does not work, copy and paste this URL into your web browser:
        </p>
        <p style="color: #5D1A89; font-size: 14px; word-break: break-all; margin-bottom: 24px;">
          <a href="${url}">${url}</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-bottom: 16px;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          If you did not request this email, you can safely ignore it.
        </p>
      </div>
    `,
  });
}
