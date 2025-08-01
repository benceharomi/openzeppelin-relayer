import { AbiCoder, ethers } from "ethers";
import { VerifierDeps, VerifyProof } from "./types";

const VERIFIER_ABI = [
  "function encode(uint256[] publicSignals, bytes proof) view returns (bytes)",
  "function entrypoint(bytes data) nonpayable",
];

export const createVerifyProof =
  ({ configService }: Omit<VerifierDeps, "pluginApi">): VerifyProof =>
  async ({ verifierAddress, proverResponse }) => {
    const { rpcUrl, privateKey } = configService.getVerifierConfig();

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(verifierAddress, VERIFIER_ABI, signer);

    const encodedCommand = await contract.encode(
      transformPublicSignals(proverResponse.publicOutputs),
      transformProof(proverResponse.proof)
    );

    const tx = await contract.entrypoint(encodedCommand);

    return { txHash: tx.hash };
  };

export const transformPublicSignals = (publicSignals: string[]): bigint[] =>
  publicSignals.map((s) => BigInt(s));

export const transformProof = (proof: {
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
