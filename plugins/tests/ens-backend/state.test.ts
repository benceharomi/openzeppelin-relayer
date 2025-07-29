import "@jest/globals";
import { readFileSync, existsSync } from "fs";
import {
  fromFile,
  StateConfig,
  ProverConfig,
  ChainConfig,
} from "../../ens-backend/src/state";

// Mock fs module
jest.mock("fs");
const mockReadFileSync = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe("State Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Type definitions", () => {
    describe("StateConfig", () => {
      it("should allow valid StateConfig with all required fields", () => {
        const config: StateConfig = {
          smtpUrl: "https://smtp.example.com",
          prover: {
            url: "https://prover.example.com",
            apiKey: "test-api-key",
            blueprintId: "test-blueprint-id",
            circuitCppDownloadUrl: "https://example.com/circuit.cpp",
            zkeyDownloadUrl: "https://example.com/circuit.zkey",
          },
          rpc: [
            {
              name: "Ethereum",
              chainId: 1,
              url: "https://eth.example.com",
              privateKey: "0x1234567890abcdef",
            },
          ],
        };

        expect(config.smtpUrl).toBe("https://smtp.example.com");
        expect(config.prover.url).toBe("https://prover.example.com");
        expect(config.rpc).toHaveLength(1);
        expect(config.rpc[0].name).toBe("Ethereum");
      });

      it("should allow StateConfig with multiple RPC chains", () => {
        const config: StateConfig = {
          smtpUrl: "https://smtp.example.com",
          prover: {
            url: "https://prover.example.com",
            apiKey: "test-api-key",
            blueprintId: "test-blueprint-id",
            circuitCppDownloadUrl: "https://example.com/circuit.cpp",
            zkeyDownloadUrl: "https://example.com/circuit.zkey",
          },
          rpc: [
            {
              name: "Ethereum",
              chainId: 1,
              url: "https://eth.example.com",
              privateKey: "0x1234567890abcdef",
            },
            {
              name: "Polygon",
              chainId: 137,
              url: "https://polygon.example.com",
              privateKey: "0xfedcba0987654321",
            },
          ],
        };

        expect(config.rpc).toHaveLength(2);
        expect(config.rpc[0].name).toBe("Ethereum");
        expect(config.rpc[1].name).toBe("Polygon");
      });
    });

    describe("ProverConfig", () => {
      it("should allow valid ProverConfig with all required fields", () => {
        const prover: ProverConfig = {
          url: "https://prover.example.com",
          apiKey: "test-api-key",
          blueprintId: "test-blueprint-id",
          circuitCppDownloadUrl: "https://example.com/circuit.cpp",
          zkeyDownloadUrl: "https://example.com/circuit.zkey",
        };

        expect(prover.url).toBe("https://prover.example.com");
        expect(prover.apiKey).toBe("test-api-key");
        expect(prover.blueprintId).toBe("test-blueprint-id");
        expect(prover.circuitCppDownloadUrl).toBe(
          "https://example.com/circuit.cpp"
        );
        expect(prover.zkeyDownloadUrl).toBe("https://example.com/circuit.zkey");
      });
    });

    describe("ChainConfig", () => {
      it("should allow valid ChainConfig with all required fields", () => {
        const chain: ChainConfig = {
          name: "Ethereum",
          chainId: 1,
          url: "https://eth.example.com",
          privateKey: "0x1234567890abcdef",
        };

        expect(chain.name).toBe("Ethereum");
        expect(chain.chainId).toBe(1);
        expect(chain.url).toBe("https://eth.example.com");
        expect(chain.privateKey).toBe("0x1234567890abcdef");
      });

      it("should allow ChainConfig with different chain IDs", () => {
        const chains: ChainConfig[] = [
          {
            name: "Ethereum",
            chainId: 1,
            url: "https://eth.example.com",
            privateKey: "0x1234567890abcdef",
          },
          {
            name: "Polygon",
            chainId: 137,
            url: "https://polygon.example.com",
            privateKey: "0xfedcba0987654321",
          },
          {
            name: "Arbitrum",
            chainId: 42161,
            url: "https://arbitrum.example.com",
            privateKey: "0xabcdef1234567890",
          },
        ];

        expect(chains[0].chainId).toBe(1);
        expect(chains[1].chainId).toBe(137);
        expect(chains[2].chainId).toBe(42161);
      });
    });
  });

  describe("fromFile function", () => {
    const testConfigPath = "/path/to/config.json";
    const validConfigData = {
      smtpUrl: "https://smtp.example.com",
      prover: {
        url: "https://prover.example.com",
        apiKey: "test-api-key",
        blueprintId: "test-blueprint-id",
        circuitCppDownloadUrl: "https://example.com/circuit.cpp",
        zkeyDownloadUrl: "https://example.com/circuit.zkey",
      },
      rpc: [
        {
          name: "Ethereum",
          chainId: 1,
          url: "https://eth.example.com",
          privateKey: "0x1234567890abcdef",
        },
      ],
    };

    it("should successfully load configuration from file", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(validConfigData));

      const result = fromFile(testConfigPath);

      expect(mockExistsSync).toHaveBeenCalledWith(testConfigPath);
      expect(mockReadFileSync).toHaveBeenCalledWith(testConfigPath, "utf8");
      expect(result).toEqual(validConfigData);
      expect(result.smtpUrl).toBe("https://smtp.example.com");
      expect(result.prover.apiKey).toBe("test-api-key");
      expect(result.rpc).toHaveLength(1);
    });

    it("should successfully load configuration with multiple RPC chains", () => {
      const configWithMultipleChains = {
        ...validConfigData,
        rpc: [
          {
            name: "Ethereum",
            chainId: 1,
            url: "https://eth.example.com",
            privateKey: "0x1234567890abcdef",
          },
          {
            name: "Polygon",
            chainId: 137,
            url: "https://polygon.example.com",
            privateKey: "0xfedcba0987654321",
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify(configWithMultipleChains)
      );

      const result = fromFile(testConfigPath);

      expect(result.rpc).toHaveLength(2);
      expect(result.rpc[0].name).toBe("Ethereum");
      expect(result.rpc[1].name).toBe("Polygon");
    });

    it("should throw error when configuration file does not exist", () => {
      mockExistsSync.mockReturnValue(false);

      expect(() => fromFile(testConfigPath)).toThrow(
        `Configuration file not found: ${testConfigPath}`
      );

      expect(mockExistsSync).toHaveBeenCalledWith(testConfigPath);
      expect(mockReadFileSync).not.toHaveBeenCalled();
    });

    it("should throw error when file read fails", () => {
      const readError = new Error("Permission denied");
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw readError;
      });

      expect(() => fromFile(testConfigPath)).toThrow(
        `Failed to load configuration: ${readError}`
      );

      expect(mockExistsSync).toHaveBeenCalledWith(testConfigPath);
      expect(mockReadFileSync).toHaveBeenCalledWith(testConfigPath, "utf8");
    });

    it("should throw error when JSON parsing fails", () => {
      const invalidJson = "{ invalid json content";
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(invalidJson);

      expect(() => fromFile(testConfigPath)).toThrow(
        "Failed to load configuration: SyntaxError:"
      );

      expect(mockExistsSync).toHaveBeenCalledWith(testConfigPath);
      expect(mockReadFileSync).toHaveBeenCalledWith(testConfigPath, "utf8");
    });

    it("should throw error when JSON is valid but missing required fields", () => {
      const incompleteConfig = {
        smtpUrl: "https://smtp.example.com",
        // Missing prover and rpc fields
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(incompleteConfig));

      expect(() => fromFile(testConfigPath)).toThrow(
        "Failed to load configuration: Error: Missing required fields: smtpUrl, prover, or rpc"
      );
    });

    it("should throw error when prover fields are missing", () => {
      const configWithMissingProverFields = {
        smtpUrl: "https://smtp.example.com",
        prover: {
          url: "https://prover.example.com",
          // Missing apiKey, blueprintId, circuitCppDownloadUrl, zkeyDownloadUrl
        },
        rpc: [
          {
            name: "Ethereum",
            chainId: 1,
            url: "https://eth.example.com",
            privateKey: "0x1234567890abcdef",
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify(configWithMissingProverFields)
      );

      expect(() => fromFile(testConfigPath)).toThrow(
        "Failed to load configuration: Error: Missing required prover fields"
      );
    });

    it("should throw error when rpc array is empty", () => {
      const configWithEmptyRpc = {
        smtpUrl: "https://smtp.example.com",
        prover: {
          url: "https://prover.example.com",
          apiKey: "test-api-key",
          blueprintId: "test-blueprint-id",
          circuitCppDownloadUrl: "https://example.com/circuit.cpp",
          zkeyDownloadUrl: "https://example.com/circuit.zkey",
        },
        rpc: [], // Empty array
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(configWithEmptyRpc));

      expect(() => fromFile(testConfigPath)).toThrow(
        "Failed to load configuration: Error: rpc must be a non-empty array"
      );
    });

    it("should throw error when rpc chain is missing required fields", () => {
      const configWithIncompleteChain = {
        smtpUrl: "https://smtp.example.com",
        prover: {
          url: "https://prover.example.com",
          apiKey: "test-api-key",
          blueprintId: "test-blueprint-id",
          circuitCppDownloadUrl: "https://example.com/circuit.cpp",
          zkeyDownloadUrl: "https://example.com/circuit.zkey",
        },
        rpc: [
          {
            name: "Ethereum",
            chainId: 1,
            // Missing url and privateKey
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify(configWithIncompleteChain)
      );

      expect(() => fromFile(testConfigPath)).toThrow(
        "Failed to load configuration: Error: Each rpc chain must have name, chainId, url, and privateKey"
      );
    });

    it("should handle empty configuration file", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("");

      expect(() => fromFile(testConfigPath)).toThrow(
        "Failed to load configuration: SyntaxError:"
      );
    });

    it("should handle whitespace-only configuration file", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("   \n\t   ");

      expect(() => fromFile(testConfigPath)).toThrow(
        "Failed to load configuration: SyntaxError:"
      );
    });

    it("should handle null configuration", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("null");

      expect(() => fromFile(testConfigPath)).toThrow(
        "Failed to load configuration: Error: Missing required fields: smtpUrl, prover, or rpc"
      );
    });

    it("should handle empty object configuration", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("{}");

      expect(() => fromFile(testConfigPath)).toThrow(
        "Failed to load configuration: Error: Missing required fields: smtpUrl, prover, or rpc"
      );
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle very large configuration files", () => {
      const largeConfig = {
        smtpUrl: "https://smtp.example.com",
        prover: {
          url: "https://prover.example.com",
          apiKey: "test-api-key",
          blueprintId: "test-blueprint-id",
          circuitCppDownloadUrl: "https://example.com/circuit.cpp",
          zkeyDownloadUrl: "https://example.com/circuit.zkey",
        },
        rpc: Array.from({ length: 1000 }, (_, i) => ({
          name: `Chain${i}`,
          chainId: i + 1,
          url: `https://chain${i}.example.com`,
          privateKey: `0x${i.toString().padStart(64, "0")}`,
        })),
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(largeConfig));

      const result = fromFile("/path/to/large-config.json");

      expect(result.rpc).toHaveLength(1000);
      expect(result.rpc[0].name).toBe("Chain0");
      expect(result.rpc[999].name).toBe("Chain999");
    });

    it("should handle special characters in configuration values", () => {
      const configWithSpecialChars = {
        smtpUrl: "https://smtp.example.com/path?param=value&other=123",
        prover: {
          url: "https://prover.example.com/api/v1",
          apiKey: "test-api-key-with-special-chars!@#$%^&*()",
          blueprintId: "blueprint-id-with-dashes-and_underscores",
          circuitCppDownloadUrl: "https://example.com/circuit.cpp?version=1.0",
          zkeyDownloadUrl: "https://example.com/circuit.zkey#fragment",
        },
        rpc: [
          {
            name: "Ethereum Mainnet",
            chainId: 1,
            url: "https://eth.example.com/rpc?api_key=secret",
            privateKey:
              "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(configWithSpecialChars));

      const result = fromFile("/path/to/config.json");

      expect(result.smtpUrl).toBe(
        "https://smtp.example.com/path?param=value&other=123"
      );
      expect(result.prover.apiKey).toBe(
        "test-api-key-with-special-chars!@#$%^&*()"
      );
      expect(result.rpc[0].name).toBe("Ethereum Mainnet");
    });
  });
});
