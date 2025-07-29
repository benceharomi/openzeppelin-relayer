export type ProverConfig = {
  url: string;
  apiKey: string;
  blueprintId: string;
  circuitCppDownloadUrl: string;
  zkeyDownloadUrl: string;
};

export type ProverDeps = {
  config: ProverConfig;
};

export type Proof = {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
};

export type ProveRequest = {
  blueprintId: string;
  proofId: string;
  zkeyDownloadUrl: string;
  circuitCppDownloadUrl: string;
  input: any;
};

export type ProofResponse = {
  proof: Proof;
  publicOutputs: string[];
};

export type GenerateProof = (body: string) => Promise<ProofResponse>;

export type ProverService = {
  generateProof: GenerateProof;
};
