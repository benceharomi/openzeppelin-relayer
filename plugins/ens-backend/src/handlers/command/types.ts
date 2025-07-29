import { SmtpService } from "../../services/smtp";
import { TemplateService } from "../../services/template";

export type CommandHandlerDeps = {
  smtpService: SmtpService;
  templateService: TemplateService;
};

export type CommandHandlerRequest = {
  email: string;
  command: string;
  verifier: string;
};

export type CommandHandler = (
  request: CommandHandlerRequest
) => Promise<string>;
