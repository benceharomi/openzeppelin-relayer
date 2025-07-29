import { AbiCoder } from "ethers";

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
