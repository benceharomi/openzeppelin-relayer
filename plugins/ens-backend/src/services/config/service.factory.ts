import { ConfigDeps, ConfigService } from "./types";

export const createConfigService = (deps: ConfigDeps): ConfigService => {
  return {
    getProverConfig: () => deps.config.prover,
    getSmtpConfig: () => deps.config.smtp,
    getTemplateConfig: () => deps.config.template,
    getVerifierConfig: () => deps.config.verifier,
  };
};
