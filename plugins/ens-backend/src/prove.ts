import { ProverConfig } from "./config";

interface Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
}

interface ProveRequest {
  blueprintId: string;
  proofId: string;
  zkeyDownloadUrl: string;
  circuitCppDownloadUrl: string;
  input: any;
}

interface ProofResponse {
  proof: Proof;
  publicOutputs: string[];
}

export async function generateProof(
  body: string,
  proverConfig: ProverConfig
): Promise<ProofResponse> {
  console.info("Generating proof");

  // TODO relayer-utils library
  const mockInput = {
    emailBody: body,
  };

  const proveRequest: ProveRequest = {
    blueprintId: proverConfig.blueprintId,
    proofId: "",
    zkeyDownloadUrl: proverConfig.zkeyDownloadUrl,
    circuitCppDownloadUrl: proverConfig.circuitCppDownloadUrl,
    input: mockInput,
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
}
