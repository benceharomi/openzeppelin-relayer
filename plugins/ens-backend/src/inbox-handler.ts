import { ethers } from "ethers";
import { generateProof } from "./prove";
import { loadAndRenderTransactionSuccessTemplate } from "./template";
import { sendRequest } from "./smtp";
import { StateConfig } from "./state";
import { PluginAPI } from "../../lib/plugin";
import { fromEmailBody } from "./command-request";
import { exportProofBytes, exportPublicInputs } from "./proof";

const PROOF_ENCODER_ABI = [
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "input",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "proof",
        type: "bytes",
      },
    ],
    name: "encode",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "command",
        type: "bytes",
      },
    ],
    name: "entrypoint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export type InboxHandlerRequest = {
  emailBody: string;
};

export async function inboxHandler(
  api: PluginAPI,
  state: StateConfig,
  request: InboxHandlerRequest
): Promise<string> {
  console.info("Received inbox request", request);

  const commandRequest = await fromEmailBody(request.emailBody).catch(
    (error) => {
      console.error("Failed to get command request:", error);
      throw new Error("Failed to get command request");
    }
  );

  const proof = await generateProof(request.emailBody, state.prover).catch(
    (error) => {
      console.error("Failed to generate proof:", error);
      throw new Error("Failed to generate proof");
    }
  );

  const chain = state.rpc[0];
  if (!chain) {
    throw new Error("No rpc found");
  }

  const provider = new ethers.JsonRpcProvider(chain.url);

  const proofBytes = exportProofBytes(proof.proof);
  const publicInputs = exportPublicInputs(proof.publicOutputs);

  console.info("proof bytes", proofBytes);
  console.info("public inputs", publicInputs);

  const verifier = new ethers.Contract(
    commandRequest.verifier,
    PROOF_ENCODER_ABI,
    provider
  );
  const encodedProof: string = await verifier.encode(publicInputs, proofBytes);
  console.info("Encoded proof:", encodedProof);

  const pendingTx = await verifier.entrypoint(encodedProof);
  console.info("Pending transaction:", pendingTx.hash);

  const relayer = api.useRelayer(chain.name);
  const result = await relayer.sendTransaction(pendingTx);

  const txResponse = await result.wait();
  const txHash = txResponse.hash || "unknown";

  console.info("Transaction submitted with hash:", txHash);

  await sendRequest(
    {
      to: commandRequest.email,
      subject: "Your Request has been Completed",
      bodyPlain: `Your request has been successfully processed. Transaction hash: ${txHash}`,
      bodyHtml: loadAndRenderTransactionSuccessTemplate(txHash),
    },
    state.smtpUrl
  );

  return "success";
}
