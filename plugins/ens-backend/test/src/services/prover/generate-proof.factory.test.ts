import fs from "fs";
import path from "path";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import {
  createGenerateProof,
  generateInputs,
} from "../../../../src/services/prover/generate-proof.factory";
import {
  ProverConfig,
  ProverConfigService,
} from "../../../../src/services/prover/types";
import { LoggerService } from "../../../../src/services/logger";

describe("generate-proof.factory", () => {
  let mockConfigService: ProverConfigService;
  let mockLoggerService: LoggerService;
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

    mockLoggerService = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      getLogger: jest.fn(),
      createChild: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        getLogger: jest.fn(),
        createChild: jest.fn(),
      }),
    } as LoggerService;

    generateProof = createGenerateProof({
      configService: mockConfigService,
      loggerService: mockLoggerService,
    });
  });

  afterEach(() => {
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
        `../../../fixtures/${fixtureDir}/email.eml`
      );
      const inputsPath = path.join(
        __dirname,
        `../../../fixtures/${fixtureDir}/inputs.json`
      );

      const email = fs.readFileSync(emailPath, "utf-8");
      const expectedInputsStr = fs.readFileSync(inputsPath, "utf-8");
      const expectedInputs = JSON.parse(expectedInputsStr);
      const inputs = await generateInputs({ loggerService: mockLoggerService })(
        email
      );

      // Test exact equality like the Rust version
      expect(inputs).toEqual(expectedInputs);
    }
  });

  describe("generateProof", () => {
    let server: ReturnType<typeof setupServer>;

    beforeAll(() => {
      server = setupServer();
      server.listen({
        onUnhandledRequest: "bypass", // Suppress warnings for unhandled requests
      });
    });

    afterAll(() => {
      server.close();
    });

    beforeEach(() => {
      server.resetHandlers();
    });

    it("should generate proof for case1_claim", async () => {
      await runGenerateProofTest("case1_claim");
    });

    it("should generate proof for case2_claim_with_resolver", async () => {
      await runGenerateProofTest("case2_claim_with_resolver");
    });

    async function runGenerateProofTest(fixtureDir: string) {
      const emailPath = path.join(
        __dirname,
        `../../../fixtures/${fixtureDir}/email.eml`
      );
      const inputsPath = path.join(
        __dirname,
        `../../../fixtures/${fixtureDir}/inputs.json`
      );
      const proverResponsePath = path.join(
        __dirname,
        `../../../fixtures/${fixtureDir}/prover_response.json`
      );

      const rawEmail = fs.readFileSync(emailPath, "utf-8");
      const expectedInputsStr = fs.readFileSync(inputsPath, "utf-8");
      const expectedInputs = JSON.parse(expectedInputsStr);

      const expectedRequest = {
        blueprintId: "dummy-blueprint",
        proofId: "",
        zkeyDownloadUrl: "http://example.com/circuit.zkey",
        circuitCppDownloadUrl: "http://example.com/circuit.cpp",
        input: expectedInputs,
      };

      const proverResponseStr = fs.readFileSync(proverResponsePath, "utf-8");
      const proverResponse = JSON.parse(proverResponseStr);

      server.use(
        http.post("http://example.com/api/prove", async ({ request }) => {
          expect(request.headers.get("x-api-key")).toBe("test-key");
          expect(request.headers.get("content-type")).toBe("application/json");
          expect(await request.json()).toEqual(expectedRequest);

          return HttpResponse.json(proverResponse);
        })
      );

      const proof = await generateProof(rawEmail);

      // Verify the response structure like the Rust version
      expect(proof.publicOutputs).toBeDefined();
      expect(proof.publicOutputs.length).toBeGreaterThan(0);
      expect(proof.proof.protocol).toBe("groth16");
    }
  });
});
