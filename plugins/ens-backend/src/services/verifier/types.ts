import { PluginAPI } from "../../../../lib/plugin";
import { Proof } from "../prover";

export type VerifierConfig = {
  rpcUrl: string;
};

export type VerifierDeps = {
  config: VerifierConfig;
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
