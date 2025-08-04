import type { LoggerConfig, LoggerConfigService } from "../logger";
import type { ProverConfig, ProverConfigService } from "../prover";
import type { SmtpConfig, SmtpConfigService } from "../smtp";
import type { TemplateConfig, TemplateConfigService } from "../template";
import type { VerifierConfig, VerifierConfigService } from "../verifier";

export type Config = {
  logger: LoggerConfig;
  prover: ProverConfig;
  smtp: SmtpConfig;
  template: TemplateConfig;
  verifier: VerifierConfig;
};

export type ConfigDeps = {
  config: Config;
};

export type ConfigService = LoggerConfigService &
  SmtpConfigService &
  TemplateConfigService &
  VerifierConfigService &
  ProverConfigService;
