import { SITE_URL, WHATSAPP_COMMUNITY_URL } from "../data/eventInfo";

/** Self-hosted white WhatsApp icon — email clients block data-URI SVGs. */
const WHATSAPP_ICON_EMAIL = `${SITE_URL}/whatsapp-icon-white.png`;

/** HTML block for the confirmation email — placed after the QR code section. */
export function buildWhatsAppCommunityEmailBlock(): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td class="section-padding" style="padding:26px 32px;text-align:center;">
          <p style="color:#888888;font-size:13px;margin:0 0 6px 0;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Stay Connected</p>
          <p style="color:#aaaaaa;font-size:14px;margin:0 0 18px 0;line-height:1.5;padding:0 4px;">Join the official NEXA 2026 delegates group for event updates, reminders, and networking.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" class="whatsapp-wrap" style="margin:0 auto;width:auto;max-width:100%;">
            <tr>
              <td align="center" class="whatsapp-btn" style="border-radius:999px;background-color:#25D366;">
                <a href="${WHATSAPP_COMMUNITY_URL}" target="_blank" style="color:#ffffff;text-decoration:none;display:block;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td class="whatsapp-btn-icon" style="padding:14px 0 14px 22px;vertical-align:middle;width:22px;">
                        <img src="${WHATSAPP_ICON_EMAIL}" width="22" height="22" alt="WhatsApp"
                             style="display:block;border:0;outline:none;text-decoration:none;" />
                      </td>
                      <td class="whatsapp-btn-text" style="padding:14px 22px 14px 10px;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;line-height:1.35;text-align:left;">
                        Join Delegates WhatsApp Community
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}
