import { readFileSync, existsSync } from "fs";

export type StateConfig = {
  smtpUrl: string;
  prover: ProverConfig;
  rpc: ChainConfig[];
  test?: boolean;
};

export type ProverConfig = {
  url: string;
  apiKey: string;
  blueprintId: string;
  circuitCppDownloadUrl: string;
  zkeyDownloadUrl: string;
};

type ChainConfig = {
  name: string;
  chainId: number;
  url: string;
  privateKey: string;
};

export function fromFile(path: string): StateConfig {
  if (!existsSync(path)) {
    throw new Error(`Configuration file not found: ${path}`);
  }

  try {
    const content = readFileSync(path, "utf8");
    const config: StateConfig = JSON.parse(content);
    return config;
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error}`);
  }
}
