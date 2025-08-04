import { PluginAPI } from "../../../../lib/plugin";
import { ProverResponse } from "../prover";
import { LoggerService } from "../logger";

export type VerifierConfig = {
  rpcUrl: string;
  privateKey: string;
};

export type VerifierConfigService = {
  getVerifierConfig: () => VerifierConfig;
};

export type VerifierDeps = {
  configService: VerifierConfigService;
  pluginApi: PluginAPI;
  loggerService: LoggerService;
};

export type VerifyProof = (inputs: {
  verifierAddress: string;
  proverResponse: ProverResponse;
}) => Promise<{ txHash: string }>;

export type VerifierService = {
  verifyProof: VerifyProof;
};
