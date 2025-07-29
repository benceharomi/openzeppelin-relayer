export type SmtpConfig = {
  smtpUrl: string;
};

export type SmtpDeps = {
  config: SmtpConfig;
};

export type SmtpRequest = {
  to: string;
  subject: string;
  bodyPlain: string;
  bodyHtml: string;
  reference?: string;
  replyTo?: string;
  bodyAttachments?: string;
};

export type SendRequest = (request: SmtpRequest) => Promise<void>;

export type SmtpService = {
  sendRequest: SendRequest;
};
