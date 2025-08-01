export type ProverConfig = {
  url: string;
  apiKey: string;
  blueprintId: string;
  circuitCppDownloadUrl: string;
  zkeyDownloadUrl: string;
};

export type ProverConfigService = {
  getProverConfig: () => ProverConfig;
};

export type ProverDeps = {
  configService: ProverConfigService;
};

export type ProveRequest = {
  blueprintId: string;
  proofId: string;
  zkeyDownloadUrl: string;
  circuitCppDownloadUrl: string;
  input: any;
};

export type ProverResponse = {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
  };
  publicOutputs: string[];
};

export type GenerateProof = (rawEmail: string) => Promise<ProverResponse>;

export type ProverService = {
  generateProof: GenerateProof;
};
