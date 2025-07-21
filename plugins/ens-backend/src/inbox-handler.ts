import { ethers } from "ethers";
import { fromEmailBody } from "./command-request";
import { generateProof } from "./prove";
import { loadAndRenderTransactionSuccessTemplate } from "./template";
import { PluginAPI } from "../../lib/plugin";
import { sendSmtpRequest } from "./smtp";
import { StateConfig } from "./config";

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

export async function inboxHandler(
  api: PluginAPI,
  config: StateConfig,
  params: { emailBody: string }
): Promise<string> {
  if (!params || !params.emailBody) {
    throw new Error("Email body parameter is required");
  }
  const { emailBody } = params;

  console.info("Received inbox request");

  const commandRequest = await fromEmailBody(emailBody).catch((error) => {
    console.error("Failed to get command request:", error);
    throw new Error("Failed to get command request");
  });

  const proof = await generateProof(emailBody, config.prover).catch((error) => {
    console.error("Failed to generate proof:", error);
    throw new Error("Failed to generate proof");
  });

  const chain = config.rpc[0];
  if (!chain) {
    throw new Error("No rpc found");
  }

  const provider = new ethers.JsonRpcProvider(chain.url);

  // TODO
  const proofBytes = proof.proof;
  const publicInputs = proof.publicOutputs;

  console.info("Proof bytes:", proofBytes);
  console.info("Public inputs:", publicInputs);

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

  await sendSmtpRequest(
    {
      to: commandRequest.email,
      subject: "Your Request has been Completed",
      bodyPlain: `Your request has been successfully processed. Transaction hash: ${txHash}`,
      bodyHtml: loadAndRenderTransactionSuccessTemplate(txHash),
    },
    config.smtpUrl
  );

  return `Transaction completed successfully. Hash: ${txHash}`;
}
