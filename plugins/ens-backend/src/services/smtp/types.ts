import { LoggerService } from "../logger";

export type SmtpConfig = {
  url: string;
};

export type SmtpConfigService = {
  getSmtpConfig: () => SmtpConfig;
};

export type SmtpDeps = {
  configService: SmtpConfigService;
  loggerService: LoggerService;
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
