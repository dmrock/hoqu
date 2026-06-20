import "server-only";

import { sendEmail } from "./client";

function layout(heading: string, body: string, cta: { href: string; label: string }): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#0e0e14;padding:32px 0;font-family:Inter,Helvetica,Arial,sans-serif;color:#e6e6ee">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="background:#16161f;border:1px solid #2a2a3a;border-radius:12px;padding:32px">
            <tr><td style="font-size:18px;font-weight:700;color:#7c5cff;letter-spacing:1px;padding-bottom:24px">HOQU</td></tr>
            <tr><td style="font-size:16px;font-weight:600;padding-bottom:8px">${heading}</td></tr>
            <tr><td style="font-size:14px;line-height:1.6;color:#a0a0b0;padding-bottom:24px">${body}</td></tr>
            <tr>
              <td>
                <a href="${cta.href}" style="display:inline-block;background:#7c5cff;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px">${cta.label}</a>
              </td>
            </tr>
            <tr><td style="font-size:12px;line-height:1.6;color:#6a6a7a;padding-top:24px">If the button doesn't work, paste this link into your browser:<br /><span style="color:#a0a0b0;word-break:break-all">${cta.href}</span></td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function sendPasswordResetEmail(to: string, url: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Reset your HOQU password",
    html: layout(
      "Reset your password",
      "We got a request to reset your password. This link expires in 1 hour and can be used once. If you didn't ask for this, you can safely ignore this email.",
      { href: url, label: "Reset password" },
    ),
  });
}

export function sendEmailChangeEmail(to: string, url: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Confirm your new HOQU email",
    html: layout(
      "Confirm your new email",
      "Click below to confirm this address for your HOQU account. This link expires in 1 hour and can be used once. If you didn't request this, you can ignore this email.",
      { href: url, label: "Confirm email" },
    ),
  });
}
