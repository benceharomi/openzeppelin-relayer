import { ConfigDeps, ConfigService } from "./types";

export const createConfigService = (deps: ConfigDeps): ConfigService => {
  return {
    getLoggerConfig: () => deps.config.logger,
    getProverConfig: () => deps.config.prover,
    getSmtpConfig: () => deps.config.smtp,
    getTemplateConfig: () => deps.config.template,
    getVerifierConfig: () => deps.config.verifier,
  };
};
