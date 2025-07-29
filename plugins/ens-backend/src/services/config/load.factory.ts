import { existsSync, readFileSync } from "fs";
import { ConfigDeps, ConfigFile, Load } from "./types";
import { join } from "path";

export const createLoad =
  ({ libDirPath, configFileName }: ConfigDeps): Load =>
  () => {
    const configPath = join(libDirPath, configFileName);

    if (!existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    try {
      const content = readFileSync(configPath, "utf8");
      const configFile: ConfigFile = JSON.parse(content);

      // Check that all required fields are present
      if (
        !configFile ||
        !configFile.smtpUrl ||
        !configFile.prover ||
        !configFile.rpc
      ) {
        throw new Error("Missing required fields: smtpUrl, prover, or rpc");
      }

      if (
        !configFile.prover.url ||
        !configFile.prover.apiKey ||
        !configFile.prover.blueprintId ||
        !configFile.prover.circuitCppDownloadUrl ||
        !configFile.prover.zkeyDownloadUrl
      ) {
        throw new Error("Missing required prover fields");
      }

      if (!Array.isArray(configFile.rpc) || configFile.rpc.length === 0) {
        throw new Error("rpc must be a non-empty array");
      }

      for (const chain of configFile.rpc) {
        if (!chain.name || !chain.chainId || !chain.url || !chain.privateKey) {
          throw new Error(
            "Each rpc chain must have name, chainId, url, and privateKey"
          );
        }
      }

      return {
        smtp: {
          smtpUrl: configFile.smtpUrl,
        },
        prover: configFile.prover,
        verifier: {
          rpcUrl: configFile.rpc[0].url,
        },
        template: {
          templateDirPath: join(libDirPath, "templates"),
        },
      };
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  };
