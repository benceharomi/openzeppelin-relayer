import type { SmtpDeps, SendRequest } from "./types";

export const createSendRequest =
  ({ configService, loggerService }: SmtpDeps): SendRequest =>
  async (request) => {
    const logger = loggerService.createChild("smtp-send");
    logger.info("Sending SMTP request", {
      to: request.to,
      subject: request.subject,
    });

    const smtpConfig = configService.getSmtpConfig();

    const response = await fetch(smtpConfig.url, {
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
      logger.error(
        "SMTP request failed",
        new Error(`Status: ${response.status} ${response.statusText}`),
        {
          to: request.to,
          subject: request.subject,
          status: response.status,
          statusText: response.statusText,
        }
      );
      throw new Error(`SMTP request failed: ${response.statusText}`);
    }

    logger.info("SMTP request sent successfully", {
      to: request.to,
      subject: request.subject,
      status: response.status,
    });
  };
