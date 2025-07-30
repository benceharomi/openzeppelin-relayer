import type { SmtpDeps, SendRequest } from "./types";

export const createSendRequest =
  ({ configService }: SmtpDeps): SendRequest =>
  async (request) => {
    const smtpConfig = configService.getSmtpConfig();

    const response = await fetch(smtpConfig.smtpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: request.to,
        subject: request.subject,
        body_plain: request.bodyPlain,
        body_html: request.bodyHtml,
        reference: request.reference,
        reply_to: request.replyTo,
        body_attachments: request.bodyAttachments,
      }),
    });

    if (!response.ok) {
      throw new Error(`SMTP request failed: ${response.statusText}`);
    }
  };
