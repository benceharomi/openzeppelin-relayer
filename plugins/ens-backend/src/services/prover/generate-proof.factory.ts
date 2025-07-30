import {
  generateAccountCode,
  generateEmailCircuitInput,
} from "@zk-email/relayer-utils";
import { GenerateProof, ProverDeps, ProveRequest } from "./types";

export const createGenerateProof =
  ({ configService }: ProverDeps): GenerateProof =>
  async (body) => {
    console.info("Generating proof");

    const proverConfig = configService.getProverConfig();

    const proveRequest: ProveRequest = {
      blueprintId: proverConfig.blueprintId,
      proofId: "",
      zkeyDownloadUrl: proverConfig.zkeyDownloadUrl,
      circuitCppDownloadUrl: proverConfig.circuitCppDownloadUrl,
      input: generateInputs(body),
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

export const generateInputs = async (body: string): Promise<any> => {
  console.info("Generating inputs");

  const accountCode = await generateAccountCode();
  const emailCircuitInput = await generateEmailCircuitInput(body, accountCode, {
    ignoreBodyHashCheck: false,
    maxBodyLength: 1024,
    maxHeaderLength: 1024,
    shaPrecomputedSelector: '(<div id=3D"[^"]*zkemail[^"]*"[^>]*>)',
  }).catch((error) => {
    console.error("Failed to generate email circuit inputs", error);
    throw error;
  });

  const json = JSON.parse(emailCircuitInput);
  if (json.error) {
    console.error("Failed to convert inputs to json", json.error);
    throw new Error(json.error);
  }

  return json;
};
