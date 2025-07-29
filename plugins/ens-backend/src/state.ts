import { readFileSync, existsSync } from "fs";

export type StateConfig = {
  smtpUrl: string;
  prover: ProverConfig;
  rpc: ChainConfig[];
};

export type ProverConfig = {
  url: string;
  apiKey: string;
  blueprintId: string;
  circuitCppDownloadUrl: string;
  zkeyDownloadUrl: string;
};

export type ChainConfig = {
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

    // Check that all required fields are present
    if (!config || !config.smtpUrl || !config.prover || !config.rpc) {
      throw new Error("Missing required fields: smtpUrl, prover, or rpc");
    }

    if (
      !config.prover.url ||
      !config.prover.apiKey ||
      !config.prover.blueprintId ||
      !config.prover.circuitCppDownloadUrl ||
      !config.prover.zkeyDownloadUrl
    ) {
      throw new Error("Missing required prover fields");
    }

    if (!Array.isArray(config.rpc) || config.rpc.length === 0) {
      throw new Error("rpc must be a non-empty array");
    }

    for (const chain of config.rpc) {
      if (!chain.name || !chain.chainId || !chain.url || !chain.privateKey) {
        throw new Error(
          "Each rpc chain must have name, chainId, url, and privateKey"
        );
      }
    }

    return config;
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error}`);
  }
}
