interface SmtpRequest {
  to: string;
  subject: string;
  bodyPlain: string;
  bodyHtml: string;
  reference?: string;
  replyTo?: string;
  bodyAttachments?: string;
}

export async function sendSmtpRequest(
  request: SmtpRequest,
  smtpUrl: string
): Promise<void> {
  const response = await fetch(smtpUrl, {
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
}
