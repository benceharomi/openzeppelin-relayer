import { generateEmailCircuitInput, init } from "@zk-email/relayer-utils";
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

export async function generateInputs(body: string): Promise<any> {
  console.info("Generating inputs");

  await initWasm();

  const emailCircuitInput = await generateEmailCircuitInput(
    body,
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    {
      ignoreBodyHashCheck: false,
      maxBodyLength: 1024,
      maxHeaderLength: 1024,
      shaPrecomputeSelector: '(<div id=3D"[^"]*zkemail[^"]*"[^>]*>)',
    }
  ).catch((error) => {
    console.error("Failed to generate email circuit inputs", error);
    throw error;
  });

  const json = JSON.parse(emailCircuitInput);
  if (json.error) {
    console.error("Failed to convert inputs to json", json.error);
    throw new Error(json.error);
  }

  return json;
}

let wasmPromise: Promise<void>;

// Hack so we would only init wasm once for all tests to pass
const initWasm = () => {
  if (wasmPromise) {
    return wasmPromise;
  }

  wasmPromise = init();
  return wasmPromise;
};
