import { ProverConfig } from "./state";
import {
  generateEmailCircuitInput,
  generateAccountCode,
} from "@zk-email/relayer-utils";

export type Proof = {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
};

type ProveRequest = {
  blueprintId: string;
  proofId: string;
  zkeyDownloadUrl: string;
  circuitCppDownloadUrl: string;
  input: any;
};

type ProofResponse = {
  proof: Proof;
  publicOutputs: string[];
};

export async function generateProof(
  body: string,
  proverConfig: ProverConfig
): Promise<ProofResponse> {
  console.info("Generating proof");

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
}

async function generateInputs(body: string): Promise<any> {
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
}
