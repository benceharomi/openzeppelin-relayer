import type { ProverConfig, ProverConfigService } from "../prover";
import type { SmtpConfig, SmtpConfigService } from "../smtp";
import type { TemplateConfig, TemplateConfigService } from "../template";
import type { VerifierConfig, VerifierConfigService } from "../verifier";

export type Config = {
  smtp: SmtpConfig;
  prover: ProverConfig;
  verifier: VerifierConfig;
  template: TemplateConfig;
};

export type ConfigDeps = {
  config: Config;
};

export type ConfigService = ProverConfigService &
  SmtpConfigService &
  TemplateConfigService &
  VerifierConfigService;
