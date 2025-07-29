import type { SmtpDeps, SendRequest } from "./types";

export const createSendRequest =
  ({ config }: SmtpDeps): SendRequest =>
  async (request) => {
    const response = await fetch(config.smtpUrl, {
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
