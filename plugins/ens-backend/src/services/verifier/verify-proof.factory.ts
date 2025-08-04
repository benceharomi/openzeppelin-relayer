import { AbiCoder, ethers } from "ethers";
import { VerifierDeps, VerifyProof } from "./types";

const VERIFIER_ABI = [
  "function encode(uint256[] calldata publicSignals, bytes calldata proof) external view returns (bytes memory)",
  "function entrypoint(bytes memory data) external",
];

export const createVerifyProof =
  ({
    configService,
    loggerService,
  }: Omit<VerifierDeps, "pluginApi">): VerifyProof =>
  async ({ verifierAddress, proverResponse }) => {
    loggerService.info("Starting proof verification", {
      verifierAddress,
      proofProtocol: proverResponse.proof.protocol,
    });

    const { rpcUrl, privateKey } = configService.getVerifierConfig();

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(verifierAddress, VERIFIER_ABI, signer);

    loggerService.info("Encoding proof data", {
      publicOutputsCount: proverResponse.publicOutputs.length,
      verifierAddress,
    });

    const encodedCommand = await contract.encode(
      transformPublicSignals(proverResponse.publicOutputs),
      transformProof(proverResponse.proof)
    );

    loggerService.info("Submitting transaction to verifier contract", {
      verifierAddress,
      encodedCommandLength: encodedCommand.length,
    });

    const tx = await contract.entrypoint(encodedCommand);

    loggerService.info("Proof verification transaction submitted", {
      txHash: tx.hash,
      verifierAddress,
    });

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
