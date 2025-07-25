import { join } from "path";
import { readFileSync, existsSync } from "fs";

export interface ProverConfig {
  url: string;
  apiKey: string;
  blueprintId: string;
  circuitCppDownloadUrl: string;
  zkeyDownloadUrl: string;
}

interface ChainConfig {
  name: string;
  chainId: number;
  url: string;
  privateKey: string;
}

export interface StateConfig {
  smtpUrl: string;
  prover: ProverConfig;
  rpc: ChainConfig[];
  test?: boolean;
}

export function loadConfig(): StateConfig {
  const configPath = join(__dirname, "..", "config.json");

  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  try {
    const configData = readFileSync(configPath, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error}`);
  }
}
