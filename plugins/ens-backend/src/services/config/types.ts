import { ProverConfig } from "../prover";
import { SmtpConfig } from "../smtp";
import { VerifierConfig } from "../verifier";
import { TemplateConfig } from "../template";

export type ConfigDeps = {
  configPath: string;
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

type Config = {
  smtp: SmtpConfig;
  prover: ProverConfig;
  verifier: VerifierConfig;
  template: TemplateConfig;
};

export type Load = () => Config;

export type ConfigService = {
  load: Load;
};
