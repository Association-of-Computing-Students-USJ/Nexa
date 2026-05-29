import { EVENT_DATE } from "../data/eventInfo";
import { buildWhatsAppCommunityEmailBlock } from "./whatsappCommunity";

export type RegistrationEmailData = {
  id: string;
  name: string;
  university: string;
  year: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildRegistrationEmailHtml(t: RegistrationEmailData): string {
  const shortId = t.id.slice(0, 8).toUpperCase();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=19D1E6&bgcolor=0e0e0e&data=NEXA-2026-${t.id}&format=png`;
  const name = escapeHtml(t.name);
  const university = escapeHtml(t.university);
  const year = escapeHtml(t.year);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>NEXA 2026 Registration</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; max-width: 100%; height: auto; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0e0e0e; }
    @media only screen and (max-width: 620px) {
      .email-wrapper { padding: 12px 10px !important; }
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
      .section-padding { padding: 24px 18px !important; }
      .section-padding-sm { padding: 20px 18px !important; }
      .divider { margin-left: 18px !important; margin-right: 18px !important; }
      .email-title { font-size: 22px !important; line-height: 1.25 !important; }
      .email-subtitle { font-size: 14px !important; }
      .detail-label,
      .detail-value { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .detail-label { padding: 0 0 4px 0 !important; }
      .detail-value { padding: 0 0 14px 0 !important; word-break: break-word !important; }
      .qr-image { width: 148px !important; height: 148px !important; }
      .whatsapp-wrap { width: 100% !important; }
      .whatsapp-btn { border-radius: 12px !important; display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .whatsapp-btn-text { white-space: normal !important; font-size: 13px !important; line-height: 1.45 !important; padding: 12px 16px 12px 8px !important; }
      .whatsapp-btn-icon { padding: 12px 0 12px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0e0e0e;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0e0e0e;">
    <tr>
      <td align="center" class="email-wrapper" style="padding:24px 16px;">
        <table role="presentation" class="email-card" width="560" cellspacing="0" cellpadding="0" border="0" align="center" style="width:100%;max-width:560px;background-color:#161616;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#19D1E6,#0ea5e9,#19D1E6);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="section-padding" style="padding:36px 32px 24px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 18px;">
                <tr>
                  <td style="padding:6px 16px;border-radius:999px;background:rgba(25,209,230,0.12);border:1px solid rgba(25,209,230,0.25);">
                    <span style="color:#19D1E6;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">✓ Registration Confirmed</span>
                  </td>
                </tr>
              </table>
              <h1 class="email-title" style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 8px 0;line-height:1.2;">Welcome to NEXA 2026!</h1>
              <p class="email-subtitle" style="color:#888888;font-size:15px;margin:0;line-height:1.5;">Hi <strong style="color:#ffffff;">${name}</strong>, your spot is secured.</p>
            </td>
          </tr>
          <tr>
            <td class="divider" style="border-top:1px dashed #2a2a2a;font-size:0;line-height:0;margin:0 28px;">&nbsp;</td>
          </tr>
          <tr>
            <td class="section-padding-sm" style="padding:22px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
                <tr>
                  <td class="detail-label" style="padding:7px 0;color:#555555;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:42%;vertical-align:top;">Ticket ID</td>
                  <td class="detail-value" style="padding:7px 0;color:#19D1E6;font-family:monospace;font-size:14px;font-weight:700;vertical-align:top;">${shortId}</td>
                </tr>
                <tr>
                  <td class="detail-label" style="padding:7px 0;color:#555555;font-size:11px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">University</td>
                  <td class="detail-value" style="padding:7px 0;color:#ffffff;font-size:14px;line-height:1.45;vertical-align:top;">${university}</td>
                </tr>
                <tr>
                  <td class="detail-label" style="padding:7px 0;color:#555555;font-size:11px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">Year</td>
                  <td class="detail-value" style="padding:7px 0;color:#ffffff;font-size:14px;vertical-align:top;">${year}</td>
                </tr>
                <tr>
                  <td class="detail-label" style="padding:7px 0;color:#555555;font-size:11px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">Event Date</td>
                  <td class="detail-value" style="padding:7px 0;color:#ffffff;font-size:14px;vertical-align:top;">${EVENT_DATE}</td>
                </tr>
                <tr>
                  <td class="detail-label" style="padding:7px 0;color:#555555;font-size:11px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">Venue</td>
                  <td class="detail-value" style="padding:7px 0;color:#ffffff;font-size:14px;vertical-align:top;">USJP, Sri Lanka</td>
                </tr>
                <tr>
                  <td class="detail-label" style="padding:7px 0;color:#555555;font-size:11px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">Access</td>
                  <td class="detail-value" style="padding:7px 0;color:#ffffff;font-size:14px;vertical-align:top;">All-Access Pass</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="divider" style="border-top:1px dashed #2a2a2a;font-size:0;line-height:0;margin:0 28px;">&nbsp;</td>
          </tr>
          <tr>
            <td class="section-padding" style="padding:26px 32px;text-align:center;">
              <p style="color:#888888;font-size:13px;margin:0 0 16px 0;line-height:1.5;">Scan this QR code at the venue entrance:</p>
              <img class="qr-image" src="${qrUrl}" width="160" height="160" alt="NEXA 2026 Ticket QR Code"
                   style="width:160px;height:160px;border-radius:12px;border:1px solid #2a2a2a;display:block;margin:0 auto;" />
              <p style="color:#555555;font-size:11px;font-family:monospace;margin:10px 0 0 0;letter-spacing:0.08em;">${shortId}</p>
            </td>
          </tr>
          <tr>
            <td class="divider" style="border-top:1px dashed #2a2a2a;font-size:0;line-height:0;margin:0 28px;">&nbsp;</td>
          </tr>
          <tr>
            <td>${buildWhatsAppCommunityEmailBlock()}</td>
          </tr>
          <tr>
            <td class="divider" style="border-top:1px dashed #2a2a2a;font-size:0;line-height:0;margin:0 28px;">&nbsp;</td>
          </tr>
          <tr>
            <td class="section-padding" style="padding:22px 32px 28px;background-color:#111111;text-align:center;">
              <p style="color:#555555;font-size:13px;margin:0 0 4px 0;line-height:1.5;">Questions? Reach us at</p>
              <a href="mailto:nexa.acs.sjp@gmail.com" style="color:#19D1E6;font-size:13px;text-decoration:none;word-break:break-word;">nexa.acs.sjp@gmail.com</a>
              <p style="color:#333333;font-size:11px;margin:18px 0 0 0;line-height:1.5;">© 2026 NEXA · ACS SJP. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
