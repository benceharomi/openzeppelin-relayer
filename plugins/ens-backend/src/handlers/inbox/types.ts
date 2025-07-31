import { ProverService } from "../../services/prover";
import { SmtpService } from "../../services/smtp";
import { TemplateService } from "../../services/template";
import { VerifierService } from "../../services/verifier";

export type InboxHandlerDeps = {
  smtpService: SmtpService;
  proverService: ProverService;
  verifierService: VerifierService;
  templateService: TemplateService;
};

export type InboxHandlerRequest = {
  rawEmail: string;
};

export type InboxHandler = (request: InboxHandlerRequest) => Promise<string>;
