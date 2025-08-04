import { generateEmailCircuitInput, init } from "@zk-email/relayer-utils";
import { GenerateProof, ProverDeps, ProveRequest } from "./types";
import { LoggerService } from "../logger";

export const createGenerateProof =
  ({ configService, loggerService }: ProverDeps): GenerateProof =>
  async (rawEmail) => {
    const logger = loggerService.createChild("generate-proof");
    logger.info("Generating proof");

    const proverConfig = configService.getProverConfig();

    const proveRequest: ProveRequest = {
      blueprintId: proverConfig.blueprintId,
      proofId: "",
      zkeyDownloadUrl: proverConfig.zkeyDownloadUrl,
      circuitCppDownloadUrl: proverConfig.circuitCppDownloadUrl,
      input: await generateInputs({ loggerService })(rawEmail),
    };

    const response = await fetch(proverConfig.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": proverConfig.apiKey,
      },
      body: JSON.stringify(proveRequest),
    });

    if (!response.ok) {
      throw new Error(`Proof generation failed: ${response.statusText}`);
    }

    return await response.json();
  };

export const generateInputs =
  ({ loggerService }: { loggerService: LoggerService }) =>
  async (rawEmail: string): Promise<any> => {
    const logger = loggerService.createChild("generate-inputs");
    logger.info("Generating inputs");

    await initWasm();

    const emailCircuitInput = await generateEmailCircuitInput(
      rawEmail,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      {
        ignoreBodyHashCheck: false,
        maxBodyLength: 1024,
        maxHeaderLength: 1024,
        shaPrecomputeSelector: '(<div id=3D"[^"]*zkemail[^"]*"[^>]*>)',
      }
    ).catch((error) => {
      logger.error("Failed to generate email circuit inputs", error);
      throw error;
    });

    const json = JSON.parse(emailCircuitInput);
    if (json.error) {
      logger.error("Failed to convert inputs to json", new Error(json.error));
      throw new Error(json.error);
    }

    return json;
  };

let wasmPromise: Promise<void>;

// Hack so we would only init wasm once for all tests to pass
const initWasm = () => {
  if (wasmPromise) {
    return wasmPromise;
  }

  wasmPromise = init();
  return wasmPromise;
};
