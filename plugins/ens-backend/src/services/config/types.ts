import type { ProverConfig, ProverConfigService } from "../prover";
import type { SmtpConfig, SmtpConfigService } from "../smtp";
import type { TemplateConfig, TemplateConfigService } from "../template";
import type { VerifierConfig, VerifierConfigService } from "../verifier";

type Config = {
  smtp: SmtpConfig;
  prover: ProverConfig;
  verifier: VerifierConfig;
  template: TemplateConfig;
};

export type ConfigDeps = {
  config: Config;
};

type ChainConfig = {
  name: string;
  chainId: number;
  url: string;
  privateKey: string;
};

export type ConfigFile = {
  smtpUrl: string;
  prover: ProverConfig;
  rpc: ChainConfig[];
};

export type ConfigService = ProverConfigService &
  SmtpConfigService &
  TemplateConfigService &
  VerifierConfigService;
