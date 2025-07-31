import fs from "fs";
import path from "path";
import nock from "nock";
import {
  createGenerateProof,
  generateInputs,
} from "../../../../src/services/prover/generate-proof.factory";
import {
  ProverConfig,
  ProverConfigService,
} from "../../../../src/services/prover/types";

describe("generate-proof.factory", () => {
  let mockConfigService: ProverConfigService;
  let generateProof: ReturnType<typeof createGenerateProof>;

  beforeEach(() => {
    mockConfigService = {
      getProverConfig: jest.fn().mockReturnValue({
        url: "http://example.com/api/prove",
        apiKey: "test-key",
        blueprintId: "dummy-blueprint",
        circuitCppDownloadUrl: "http://example.com/circuit.cpp",
        zkeyDownloadUrl: "http://example.com/circuit.zkey",
      } as ProverConfig),
    };

    generateProof = createGenerateProof({ configService: mockConfigService });
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  describe("generateInputs", () => {
    it("should generate correct inputs for case1_claim", async () => {
      await runGenerateInputsTest("case1_claim");
    });

    it("should generate correct inputs for case2_claim_with_resolver", async () => {
      await runGenerateInputsTest("case2_claim_with_resolver");
    });

    async function runGenerateInputsTest(fixtureDir: string) {
      const emailPath = path.join(
        __dirname,
        `../../fixtures/${fixtureDir}/email.eml`
      );
      const inputsPath = path.join(
        __dirname,
        `../../fixtures/${fixtureDir}/inputs.json`
      );

      const email = fs.readFileSync(emailPath, "utf-8");
      const expectedInputsStr = fs.readFileSync(inputsPath, "utf-8");
      const expectedInputs = JSON.parse(expectedInputsStr);
      const inputs = await generateInputs(email);

      // Test exact equality like the Rust version
      expect(inputs).toEqual(expectedInputs);
    }
  });

  describe("generateProof", () => {
    it("should generate proof for case1_claim", async () => {
      await runGenerateProofTest("case1_claim");
    });

    it("should generate proof for case2_claim_with_resolver", async () => {
      await runGenerateProofTest("case2_claim_with_resolver");
    });

    async function runGenerateProofTest(fixtureDir: string) {
      const server = "http://example.com";
      const emailPath = path.join(
        __dirname,
        `../../fixtures/${fixtureDir}/email.eml`
      );
      const proverResponsePath = path.join(
        __dirname,
        `../../fixtures/${fixtureDir}/prover_response.json`
      );

      const email = fs.readFileSync(emailPath, "utf-8");
      const inputs = await generateInputs(email);

      const expectedRequest = {
        blueprintId: "dummy-blueprint",
        proofId: "",
        zkeyDownloadUrl: "http://example.com/circuit.zkey",
        circuitCppDownloadUrl: "http://example.com/circuit.cpp",
        input: inputs,
      };

      const proverResponse = fs.readFileSync(proverResponsePath, "utf-8");
      const expectedResponse = JSON.parse(proverResponse);

      // Mock the prover API response
      const mockScope = nock(server)
        .post("/api/prove", JSON.stringify(expectedRequest))
        .matchHeader("x-api-key", "test-key")
        .matchHeader("Content-Type", "application/json")
        .reply(200, expectedResponse);

      const proof = await generateProof(email);

      // Verify the mock was called correctly
      expect(mockScope.isDone()).toBe(true);

      // Verify the response structure like the Rust version
      expect(proof.publicOutputs).toBeDefined();
      expect(proof.publicOutputs.length).toBeGreaterThan(0);
      expect(proof.proof.protocol).toBe("groth16");
    }
  });
});
