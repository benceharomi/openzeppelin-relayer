import { ethers } from "ethers";
import { VerifierDeps, VerifyProof } from "./types";
import { AbiCoder } from "ethers";

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

export const createVerifyProof =
  ({ config, pluginApi }: VerifierDeps): VerifyProof =>
  async (verifierAddress, proof, publicOutputs) => {
    // step 0: create a provider to interact with the verifier contract
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const verifier = new ethers.Contract(
      verifierAddress,
      PROOF_ENCODER_ABI,
      provider
    );

    // step 1: verifierAddress.encode to encode the proof
    const proofBytes = exportProofBytes(proof);
    const publicInputs = exportPublicInputs(publicOutputs);
    const encodedProof = await verifier.encode(publicInputs, proofBytes);

    // step 2: verifierAddress.entrypoint to submit the proof
    const pendingTx = await verifier.entrypoint(encodedProof);

    // step 3: send the transaction to the relayer
    const relayer = pluginApi.useRelayer("sepolia-example");
    const result = await relayer.sendTransaction(pendingTx);

    const txResponse = await result.wait();
    const txHash = txResponse.hash || "unknown";
    console.info("Transaction submitted with hash:", txHash);

    return { txHash };
  };

export const exportPublicInputs = (publicOutputs: string[]): bigint[] => {
  return publicOutputs.map((s) => BigInt(s));
};

export const exportProofBytes = (proof: {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
}): string => {
  const pi_a = proof.pi_a.slice(0, 2).map(BigInt);

  const pi_b: [[bigint, bigint], [bigint, bigint]] = [
    [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
    [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
  ];

  const pi_c = proof.pi_c.slice(0, 2).map(BigInt);

  const abi = new AbiCoder();

  return abi.encode(
    ["uint256[2]", "uint256[2][2]", "uint256[2]"],
    [pi_a, pi_b, pi_c]
  );
};
