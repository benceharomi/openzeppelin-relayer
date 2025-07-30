import { PluginAPI } from "../../../../lib/plugin";
import { Proof } from "../prover";

export type VerifierConfig = {
  rpcUrl: string;
};

export type VerifierConfigService = {
  getVerifierConfig: () => VerifierConfig;
};

export type VerifierDeps = {
  configService: VerifierConfigService;
  pluginApi: PluginAPI;
};

export type VerifyProof = (
  verifierAddress: string,
  proof: Proof,
  publicOutputs: string[]
) => Promise<{ txHash: string }>;

export type VerifierService = {
  verifyProof: VerifyProof;
};
