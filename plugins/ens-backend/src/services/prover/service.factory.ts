import { createGenerateProof } from "./generate-proof.factory";
import { ProverService, ProverDeps } from "./types";

export const createProverService = (deps: ProverDeps): ProverService => {
  return {
    generateProof: createGenerateProof(deps),
  };
};
