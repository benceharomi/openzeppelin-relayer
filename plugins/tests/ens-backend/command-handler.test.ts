import "@jest/globals";
import {
  commandHandler,
  CommandHandlerRequest,
} from "../../ens-backend/src/command-handler";
import { PluginAPI } from "../../lib/plugin";
import { StateConfig } from "../../ens-backend/src/state";

// Mock dependencies
jest.mock("../../ens-backend/src/template");
jest.mock("../../ens-backend/src/smtp");
jest.mock("../../lib/plugin");

const mockLoadAndRenderCommandConfirmationTemplate = jest.mocked(
  require("../../ens-backend/src/template")
    .loadAndRenderCommandConfirmationTemplate
);
const mockSendRequest = jest.mocked(
  require("../../ens-backend/src/smtp").sendRequest
);

describe("Command Handler", () => {
  let mockApi: jest.Mocked<PluginAPI>;
  let mockState: StateConfig;
  let mockRequest: CommandHandlerRequest;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock API
    mockApi = {
      socket: {} as any,
      pending: new Map(),
      useRelayer: jest.fn(),
      transactionWait: jest.fn(),
      _send: jest.fn(),
      close: jest.fn(),
      closeErrored: jest.fn(),
    } as unknown as jest.Mocked<PluginAPI>;

    // Setup mock state
    mockState = {
      smtpUrl: "https://api.example.com/smtp",
      // Add other state properties as needed
    } as StateConfig;

    // Setup mock request
    mockRequest = {
      email: "test@example.com",
      command: "send 0.1 ETH to 0x1234567890123456789012345678901234567890",
      verifier: "verifier123",
    };

    // Setup template mock
    mockLoadAndRenderCommandConfirmationTemplate.mockReturnValue(
      "<html><body>Command confirmation template</body></html>"
    );

    // Setup SMTP mock
    mockSendRequest.mockResolvedValue(undefined);
  });

  describe("CommandHandlerRequest type", () => {
    it("should allow all required fields", () => {
      const request: CommandHandlerRequest = {
        email: "test@example.com",
        command: "send 0.1 ETH",
        verifier: "verifier123",
      };

      expect(request.email).toBe("test@example.com");
      expect(request.command).toBe("send 0.1 ETH");
      expect(request.verifier).toBe("verifier123");
    });
  });

  describe("commandHandler", () => {
    it("should successfully process a valid command request", async () => {
      const result = await commandHandler(mockApi, mockState, mockRequest);

      // Verify template was called with correct request
      expect(
        mockLoadAndRenderCommandConfirmationTemplate
      ).toHaveBeenCalledTimes(1);
      expect(mockLoadAndRenderCommandConfirmationTemplate).toHaveBeenCalledWith(
        mockRequest
      );

      // Verify SMTP request was sent with correct parameters
      expect(mockSendRequest).toHaveBeenCalledTimes(1);
      expect(mockSendRequest).toHaveBeenCalledWith(
        {
          to: mockRequest.email,
          subject: `[Reply Needed] ${mockRequest.command}`,
          bodyPlain: mockRequest.command,
          bodyHtml: "<html><body>Command confirmation template</body></html>",
        },
        mockState.smtpUrl
      );

      // Verify return value
      expect(result).toBe("success");
    });

    it("should handle command with special characters in subject", async () => {
      const requestWithSpecialChars: CommandHandlerRequest = {
        email: "test@example.com",
        command: "send 0.1 ETH to 0x1234...5678 with memo: Hello World!",
        verifier: "verifier123",
      };

      await commandHandler(mockApi, mockState, requestWithSpecialChars);

      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: `[Reply Needed] ${requestWithSpecialChars.command}`,
        }),
        mockState.smtpUrl
      );
    });

    it("should handle long command in subject", async () => {
      const longCommand =
        "send 0.1 ETH to 0x1234567890123456789012345678901234567890 with a very long memo that might exceed normal subject line lengths and should still be handled properly";
      const requestWithLongCommand: CommandHandlerRequest = {
        email: "test@example.com",
        command: longCommand,
        verifier: "verifier123",
      };

      await commandHandler(mockApi, mockState, requestWithLongCommand);

      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: `[Reply Needed] ${longCommand}`,
        }),
        mockState.smtpUrl
      );
    });

    it("should handle email with special characters", async () => {
      const requestWithSpecialEmail: CommandHandlerRequest = {
        email: "test+tag@example.com",
        command: "send 0.1 ETH",
        verifier: "verifier123",
      };

      await commandHandler(mockApi, mockState, requestWithSpecialEmail);

      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test+tag@example.com",
        }),
        mockState.smtpUrl
      );
    });

    it("should handle complex verifier string", async () => {
      const requestWithComplexVerifier: CommandHandlerRequest = {
        email: "test@example.com",
        command: "send 0.1 ETH",
        verifier: "verifier-123_456.789@special!",
      };

      await commandHandler(mockApi, mockState, requestWithComplexVerifier);

      // Template should be called with the full request including complex verifier
      expect(mockLoadAndRenderCommandConfirmationTemplate).toHaveBeenCalledWith(
        requestWithComplexVerifier
      );
    });

    it("should use the correct SMTP URL from state", async () => {
      const customState: StateConfig = {
        smtpUrl: "https://custom-smtp.example.com/api",
      } as StateConfig;

      await commandHandler(mockApi, customState, mockRequest);

      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.any(Object),
        "https://custom-smtp.example.com/api"
      );
    });

    it("should pass the command as both subject and bodyPlain", async () => {
      await commandHandler(mockApi, mockState, mockRequest);

      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: `[Reply Needed] ${mockRequest.command}`,
          bodyPlain: mockRequest.command,
        }),
        mockState.smtpUrl
      );
    });

    it("should use the rendered HTML template as bodyHtml", async () => {
      const customTemplate =
        "<html><body>Custom template content</body></html>";
      mockLoadAndRenderCommandConfirmationTemplate.mockReturnValue(
        customTemplate
      );

      await commandHandler(mockApi, mockState, mockRequest);

      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          bodyHtml: customTemplate,
        }),
        mockState.smtpUrl
      );
    });

    it("should handle empty command string", async () => {
      const requestWithEmptyCommand: CommandHandlerRequest = {
        email: "test@example.com",
        command: "",
        verifier: "verifier123",
      };

      await commandHandler(mockApi, mockState, requestWithEmptyCommand);

      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "[Reply Needed] ",
          bodyPlain: "",
        }),
        mockState.smtpUrl
      );
    });

    it("should handle whitespace-only command", async () => {
      const requestWithWhitespaceCommand: CommandHandlerRequest = {
        email: "test@example.com",
        command: "   ",
        verifier: "verifier123",
      };

      await commandHandler(mockApi, mockState, requestWithWhitespaceCommand);

      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "[Reply Needed]    ",
          bodyPlain: "   ",
        }),
        mockState.smtpUrl
      );
    });

    it("should handle empty verifier string", async () => {
      const requestWithEmptyVerifier: CommandHandlerRequest = {
        email: "test@example.com",
        command: "send 0.1 ETH",
        verifier: "",
      };

      await commandHandler(mockApi, mockState, requestWithEmptyVerifier);

      // Template should still be called with the request
      expect(mockLoadAndRenderCommandConfirmationTemplate).toHaveBeenCalledWith(
        requestWithEmptyVerifier
      );
    });

    it("should handle empty email string", async () => {
      const requestWithEmptyEmail: CommandHandlerRequest = {
        email: "",
        command: "send 0.1 ETH",
        verifier: "verifier123",
      };

      await commandHandler(mockApi, mockState, requestWithEmptyEmail);

      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "",
        }),
        mockState.smtpUrl
      );
    });
  });

  describe("Error handling", () => {
    it("should propagate template rendering errors", async () => {
      const templateError = new Error("Template rendering failed");
      mockLoadAndRenderCommandConfirmationTemplate.mockImplementation(() => {
        throw templateError;
      });

      await expect(
        commandHandler(mockApi, mockState, mockRequest)
      ).rejects.toThrow("Template rendering failed");

      expect(mockSendRequest).not.toHaveBeenCalled();
    });

    it("should propagate SMTP sending errors", async () => {
      const smtpError = new Error("SMTP sending failed");
      mockSendRequest.mockRejectedValue(smtpError);

      await expect(
        commandHandler(mockApi, mockState, mockRequest)
      ).rejects.toThrow("SMTP sending failed");

      // Template should still be called
      expect(mockLoadAndRenderCommandConfirmationTemplate).toHaveBeenCalledWith(
        mockRequest
      );
    });

    it("should handle network errors from SMTP service", async () => {
      const networkError = new Error("Network timeout");
      mockSendRequest.mockRejectedValue(networkError);

      await expect(
        commandHandler(mockApi, mockState, mockRequest)
      ).rejects.toThrow("Network timeout");
    });

    it("should handle SMTP service returning non-200 status", async () => {
      const smtpError = new Error("SMTP service error: 500");
      mockSendRequest.mockRejectedValue(smtpError);

      await expect(
        commandHandler(mockApi, mockState, mockRequest)
      ).rejects.toThrow("SMTP service error: 500");
    });
  });

  describe("Integration scenarios", () => {
    it("should handle a complete ENS command workflow", async () => {
      const ensCommandRequest: CommandHandlerRequest = {
        email: "user@example.com",
        command: "setText record.ens.eth key value",
        verifier: "ens-verifier-2024",
      };

      const result = await commandHandler(
        mockApi,
        mockState,
        ensCommandRequest
      );

      expect(mockLoadAndRenderCommandConfirmationTemplate).toHaveBeenCalledWith(
        ensCommandRequest
      );
      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "[Reply Needed] setText record.ens.eth key value",
          bodyPlain: "setText record.ens.eth key value",
        }),
        mockState.smtpUrl
      );
      expect(result).toBe("success");
    });

    it("should handle multiple concurrent requests", async () => {
      const requests = [
        {
          email: "user1@example.com",
          command: "command1",
          verifier: "verifier1",
        },
        {
          email: "user2@example.com",
          command: "command2",
          verifier: "verifier2",
        },
        {
          email: "user3@example.com",
          command: "command3",
          verifier: "verifier3",
        },
      ];

      const promises = requests.map((request) =>
        commandHandler(mockApi, mockState, request as CommandHandlerRequest)
      );

      const results = await Promise.all(promises);

      expect(results).toEqual(["success", "success", "success"]);
      expect(mockSendRequest).toHaveBeenCalledTimes(3);
      expect(
        mockLoadAndRenderCommandConfirmationTemplate
      ).toHaveBeenCalledTimes(3);
    });

    it("should handle requests with different SMTP URLs", async () => {
      const state1: StateConfig = {
        smtpUrl: "https://smtp1.example.com",
      } as StateConfig;
      const state2: StateConfig = {
        smtpUrl: "https://smtp2.example.com",
      } as StateConfig;

      await commandHandler(mockApi, state1, mockRequest);
      await commandHandler(mockApi, state2, mockRequest);

      expect(mockSendRequest).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        "https://smtp1.example.com"
      );
      expect(mockSendRequest).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        "https://smtp2.example.com"
      );
    });
  });

  describe("Logging", () => {
    it("should log the command request", async () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      await commandHandler(mockApi, mockState, mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith("Command request:", mockRequest);

      consoleSpy.mockRestore();
    });

    it("should log even when errors occur", async () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();
      mockSendRequest.mockRejectedValue(new Error("SMTP error"));

      try {
        await commandHandler(mockApi, mockState, mockRequest);
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith("Command request:", mockRequest);

      consoleSpy.mockRestore();
    });
  });
});
