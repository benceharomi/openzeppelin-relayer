import "@jest/globals";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  loadAndRenderCommandConfirmationTemplate,
  loadAndRenderTransactionSuccessTemplate,
} from "../../ens-backend/src/template";
import { CommandRequest } from "../../ens-backend/src/command-request";

// Mock fs module
jest.mock("fs");
const mockReadFileSync = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

// Mock path module
jest.mock("path");
const mockJoin = join as jest.MockedFunction<typeof join>;

describe("Template Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadAndRenderCommandConfirmationTemplate", () => {
    const mockCommandRequest: CommandRequest = {
      email: "test@example.com",
      command: "transfer 0.1 ETH to 0x1234567890abcdef",
      verifier: "test-verifier",
    };

    const mockTemplateContent = `
      <div class="instructions">
        <p>Please reply "confirm" to confirm the below command.</p>
      </div>
      <div id="relayer-data" style="display: none">{{relayer_data}}</div>
      <div id="zkemail" class="command">{{command}}</div>
    `;

    it("should load and render command confirmation template successfully", () => {
      const expectedTemplatePath =
        "/mock/path/templates/command_confirmation.html";

      mockJoin.mockReturnValue(expectedTemplatePath);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockTemplateContent);

      const result =
        loadAndRenderCommandConfirmationTemplate(mockCommandRequest);

      expect(mockJoin).toHaveBeenCalledWith(
        expect.any(String),
        "..",
        "templates/command_confirmation.html"
      );
      expect(mockExistsSync).toHaveBeenCalledWith(expectedTemplatePath);
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expectedTemplatePath,
        "utf8"
      );

      expect(result).toContain(mockCommandRequest.command);
      expect(result).toContain("test@example.com");
      expect(result).toContain("test-verifier");
      expect(result).toContain("transfer 0.1 ETH to 0x1234567890abcdef");
    });

    it("should throw error when command is empty", () => {
      const requestWithEmptyCommand: CommandRequest = {
        email: "test@example.com",
        command: "",
        verifier: "test-verifier",
      };

      expect(() => {
        loadAndRenderCommandConfirmationTemplate(requestWithEmptyCommand);
      }).toThrow("Command is required and cannot be empty");
    });

    it("should throw error when command is only whitespace", () => {
      const requestWithWhitespaceCommand: CommandRequest = {
        email: "test@example.com",
        command: "   ",
        verifier: "test-verifier",
      };

      expect(() => {
        loadAndRenderCommandConfirmationTemplate(requestWithWhitespaceCommand);
      }).toThrow("Command is required and cannot be empty");
    });

    it("should throw error when email is empty", () => {
      const requestWithEmptyEmail: CommandRequest = {
        email: "",
        command: "transfer 0.1 ETH",
        verifier: "test-verifier",
      };

      expect(() => {
        loadAndRenderCommandConfirmationTemplate(requestWithEmptyEmail);
      }).toThrow("Email is required and cannot be empty");
    });

    it("should throw error when verifier is empty", () => {
      const requestWithEmptyVerifier: CommandRequest = {
        email: "test@example.com",
        command: "transfer 0.1 ETH",
        verifier: "",
      };

      expect(() => {
        loadAndRenderCommandConfirmationTemplate(requestWithEmptyVerifier);
      }).toThrow("Verifier is required and cannot be empty");
    });

    it("should throw error when request is null", () => {
      expect(() => {
        loadAndRenderCommandConfirmationTemplate(null as any);
      }).toThrow("CommandRequest is required");
    });

    it("should throw error when request is undefined", () => {
      expect(() => {
        loadAndRenderCommandConfirmationTemplate(undefined as any);
      }).toThrow("CommandRequest is required");
    });

    it("should handle command request with special characters in command", () => {
      const requestWithSpecialChars: CommandRequest = {
        email: "test@example.com",
        command:
          "transfer 0.1 ETH to 0x1234567890abcdef & <script>alert('xss')</script>",
        verifier: "test-verifier",
      };

      mockJoin.mockReturnValue(
        "/mock/path/templates/command_confirmation.html"
      );
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockTemplateContent);

      const result = loadAndRenderCommandConfirmationTemplate(
        requestWithSpecialChars
      );

      expect(result).toContain(
        "transfer 0.1 ETH to 0x1234567890abcdef & <script>alert('xss')</script>"
      );
      expect(result).toContain("test@example.com");
      expect(result).toContain("test-verifier");
    });

    it("should throw error when template file does not exist", () => {
      mockJoin.mockReturnValue(
        "/mock/path/templates/command_confirmation.html"
      );
      mockExistsSync.mockReturnValue(false);

      expect(() => {
        loadAndRenderCommandConfirmationTemplate(mockCommandRequest);
      }).toThrow(
        "Template file not found: /mock/path/templates/command_confirmation.html"
      );

      expect(mockExistsSync).toHaveBeenCalledWith(
        "/mock/path/templates/command_confirmation.html"
      );
      expect(mockReadFileSync).not.toHaveBeenCalled();
    });

    it("should throw error when template file is empty", () => {
      mockJoin.mockReturnValue(
        "/mock/path/templates/command_confirmation.html"
      );
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("");

      expect(() => {
        loadAndRenderCommandConfirmationTemplate(mockCommandRequest);
      }).toThrow(
        "Template file is empty: /mock/path/templates/command_confirmation.html"
      );

      expect(mockReadFileSync).toHaveBeenCalledWith(
        "/mock/path/templates/command_confirmation.html",
        "utf8"
      );
    });

    it("should properly escape HTML in relayer data", () => {
      const requestWithHtmlChars: CommandRequest = {
        email: "test@example.com",
        command: "transfer 0.1 ETH",
        verifier: "test-verifier",
      };

      mockJoin.mockReturnValue(
        "/mock/path/templates/command_confirmation.html"
      );
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockTemplateContent);

      const result =
        loadAndRenderCommandConfirmationTemplate(requestWithHtmlChars);

      // Check that the JSON data is properly escaped
      expect(result).toContain(
        "&quot;email&quot;:&quot;test@example.com&quot;"
      );
      expect(result).toContain(
        "&quot;command&quot;:&quot;transfer 0.1 ETH&quot;"
      );
      expect(result).toContain(
        "&quot;verifier&quot;:&quot;test-verifier&quot;"
      );
    });
  });

  describe("loadAndRenderTransactionSuccessTemplate", () => {
    const mockTemplateContent = `
      <div class="header">Your Request is Complete!</div>
      <div class="content">
        <p>You can view the transaction details here:
          <a href="https://sepolia.etherscan.io/tx/{{tx_hash}}"
            >https://sepolia.etherscan.io/tx/{{tx_hash}}</a>
        </p>
      </div>
    `;

    it("should load and render transaction success template successfully", () => {
      const txHash =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const expectedTemplatePath =
        "/mock/path/templates/transaction_success.html";

      mockJoin.mockReturnValue(expectedTemplatePath);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockTemplateContent);

      const result = loadAndRenderTransactionSuccessTemplate(txHash);

      expect(mockJoin).toHaveBeenCalledWith(
        expect.any(String),
        "..",
        "templates/transaction_success.html"
      );
      expect(mockExistsSync).toHaveBeenCalledWith(expectedTemplatePath);
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expectedTemplatePath,
        "utf8"
      );

      expect(result).toContain(txHash);
      expect(result).toContain(
        "https://sepolia.etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      );
    });

    it("should throw error when transaction hash is empty", () => {
      expect(() => {
        loadAndRenderTransactionSuccessTemplate("");
      }).toThrow("Transaction hash is required and cannot be empty");
    });

    it("should throw error when transaction hash is only whitespace", () => {
      expect(() => {
        loadAndRenderTransactionSuccessTemplate("   ");
      }).toThrow("Transaction hash is required and cannot be empty");
    });

    it("should throw error when transaction hash is null", () => {
      expect(() => {
        loadAndRenderTransactionSuccessTemplate(null as any);
      }).toThrow("Transaction hash is required and cannot be empty");
    });

    it("should throw error when transaction hash is undefined", () => {
      expect(() => {
        loadAndRenderTransactionSuccessTemplate(undefined as any);
      }).toThrow("Transaction hash is required and cannot be empty");
    });

    it("should throw error when template file does not exist", () => {
      const txHash = "0x1234567890abcdef";

      mockJoin.mockReturnValue("/mock/path/templates/transaction_success.html");
      mockExistsSync.mockReturnValue(false);

      expect(() => {
        loadAndRenderTransactionSuccessTemplate(txHash);
      }).toThrow(
        "Template file not found: /mock/path/templates/transaction_success.html"
      );

      expect(mockExistsSync).toHaveBeenCalledWith(
        "/mock/path/templates/transaction_success.html"
      );
      expect(mockReadFileSync).not.toHaveBeenCalled();
    });

    it("should throw error when template file is empty", () => {
      const txHash = "0x1234567890abcdef";

      mockJoin.mockReturnValue("/mock/path/templates/transaction_success.html");
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("");

      expect(() => {
        loadAndRenderTransactionSuccessTemplate(txHash);
      }).toThrow(
        "Template file is empty: /mock/path/templates/transaction_success.html"
      );

      expect(mockReadFileSync).toHaveBeenCalledWith(
        "/mock/path/templates/transaction_success.html",
        "utf8"
      );
    });

    it("should handle transaction hash with special characters", () => {
      const txHash = "0x1234567890abcdef<>&\"'";

      mockJoin.mockReturnValue("/mock/path/templates/transaction_success.html");
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockTemplateContent);

      const result = loadAndRenderTransactionSuccessTemplate(txHash);

      expect(result).toContain("0x1234567890abcdef<>&\"'");
      expect(result).toContain(
        "https://sepolia.etherscan.io/tx/0x1234567890abcdef<>&\"'"
      );
    });

    it("should handle template with multiple placeholders", () => {
      const txHash = "0x1234567890abcdef";
      const templateWithMultiplePlaceholders = `
        <div>Hash: {{tx_hash}}</div>
        <div>Link: https://sepolia.etherscan.io/tx/{{tx_hash}}</div>
        <div>Another reference: {{tx_hash}}</div>
      `;

      mockJoin.mockReturnValue("/mock/path/templates/transaction_success.html");
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(templateWithMultiplePlaceholders);

      const result = loadAndRenderTransactionSuccessTemplate(txHash);

      expect(result).toContain("Hash: 0x1234567890abcdef");
      expect(result).toContain(
        "Link: https://sepolia.etherscan.io/tx/{{tx_hash}}"
      );
      expect(result).toContain("Another reference: {{tx_hash}}");

      // Should only replace the first instance since .replace() only replaces first occurrence
      const hashOccurrences = (result.match(/0x1234567890abcdef/g) || [])
        .length;
      expect(hashOccurrences).toBe(1);
    });
  });
});
