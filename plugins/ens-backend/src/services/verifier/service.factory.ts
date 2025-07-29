import { VerifierConfig, VerifierDeps, VerifierService } from "./types";
import { createVerifyProof } from "./verify-proof.factory";

export const createVerifierService = (deps: VerifierDeps): VerifierService => {
  return {
    verifyProof: createVerifyProof(deps),
  };
};
