import { access, readFile } from "fs/promises";
import { join } from "path";
import Joi from "joi";
import type { Config } from "./types";

const chainConfigSchema = Joi.object({
  name: Joi.string().required(),
  chainId: Joi.number().required(),
  url: Joi.string().uri().required(),
  privateKey: Joi.string().required(),
});

const proverConfigSchema = Joi.object({
  url: Joi.string().required(),
  apiKey: Joi.string().required(),
  blueprintId: Joi.string().required(),
  circuitCppDownloadUrl: Joi.string().uri().required(),
  zkeyDownloadUrl: Joi.string().uri().required(),
});

const configFileSchema = Joi.object({
  smtpUrl: Joi.string().uri().required(),
  prover: proverConfigSchema.required(),
  rpc: Joi.array().items(chainConfigSchema).min(1).required(),
});

export const loadConfig = async (
  libDirPath: string,
  configFileName: string
): Promise<Config> => {
  const configPath = join(libDirPath, configFileName);

  try {
    await access(configPath);
  } catch {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  try {
    const content = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(content);

    // Validate config using Joi schema
    const { error, value } = configFileSchema.validate(parsed, {
      abortEarly: false, // report all errors
      allowUnknown: true, // allow other keys but they won't be validated
      stripUnknown: true, // strip keys not in schema
    });

    if (error) {
      // Format Joi error messages
      const message = error.details
        .map((d) => `${d.message} (path: ${d.path.join(".")})`)
        .join("; ");
      throw new Error(`Invalid configuration: ${message}`);
    }

    return {
      smtp: {
        smtpUrl: value.smtpUrl,
      },
      prover: value.prover,
      verifier: {
        rpcUrl: value.rpc[0].url, // use the first RPC url for verifier
      },
      template: {
        templateDirPath: join(libDirPath, "templates"),
      },
    };
  } catch (error) {
    throw new Error(
      `Failed to load configuration: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
};
