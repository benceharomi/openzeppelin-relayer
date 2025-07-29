import "@jest/globals";
import { sendRequest, SmtpRequest } from "../../ens-backend/src/smtp";

// Mock fetch globally
global.fetch = jest.fn();

describe("SMTP Module", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const testSmtpUrl = "https://api.example.com/smtp";

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("SmtpRequest type", () => {
    it("should allow all required fields", () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
      };

      expect(request.to).toBe("test@example.com");
      expect(request.subject).toBe("Test Subject");
      expect(request.bodyPlain).toBe("Plain text body");
      expect(request.bodyHtml).toBe("<p>HTML body</p>");
    });

    it("should allow optional fields", () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
        reference: "REF123",
        replyTo: "reply@example.com",
        bodyAttachments: "attachment1.pdf",
      };

      expect(request.reference).toBe("REF123");
      expect(request.replyTo).toBe("reply@example.com");
      expect(request.bodyAttachments).toBe("attachment1.pdf");
    });
  });

  describe("sendRequest", () => {
    it("should send a successful request with required fields only", async () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response);

      await sendRequest(request, testSmtpUrl);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(testSmtpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "test@example.com",
          subject: "Test Subject",
          body_plain: "Plain text body",
          body_html: "<p>HTML body</p>",
          reference: undefined,
          reply_to: undefined,
          body_attachments: undefined,
        }),
      });
    });

    it("should send a request with all fields including optional ones", async () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
        reference: "REF123",
        replyTo: "reply@example.com",
        bodyAttachments: "attachment1.pdf",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response);

      await sendRequest(request, testSmtpUrl);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(testSmtpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "test@example.com",
          subject: "Test Subject",
          body_plain: "Plain text body",
          body_html: "<p>HTML body</p>",
          reference: "REF123",
          reply_to: "reply@example.com",
          body_attachments: "attachment1.pdf",
        }),
      });
    });

    it("should handle empty optional fields correctly", async () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
        reference: "",
        replyTo: "",
        bodyAttachments: "",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response);

      await sendRequest(request, testSmtpUrl);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);

      expect(requestBody.reference).toBe("");
      expect(requestBody.reply_to).toBe("");
      expect(requestBody.body_attachments).toBe("");
    });

    it("should throw an error when response is not ok", async () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      } as Response);

      await expect(sendRequest(request, testSmtpUrl)).rejects.toThrow(
        "SMTP request failed: Bad Request"
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should throw an error when response status is 500", async () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(sendRequest(request, testSmtpUrl)).rejects.toThrow(
        "SMTP request failed: Internal Server Error"
      );
    });

    it("should throw an error when response status is 401", async () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      } as Response);

      await expect(sendRequest(request, testSmtpUrl)).rejects.toThrow(
        "SMTP request failed: Unauthorized"
      );
    });

    it("should handle network errors", async () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
      };

      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(sendRequest(request, testSmtpUrl)).rejects.toThrow(
        "Network error"
      );
    });

    it("should handle different SMTP URLs", async () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
      };

      const customSmtpUrl = "https://custom-smtp.example.com/api/send";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response);

      await sendRequest(request, customSmtpUrl);

      expect(mockFetch).toHaveBeenCalledWith(customSmtpUrl, expect.any(Object));
    });

    it("should handle special characters in email content", async () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test with special chars: éñç & symbols!",
        bodyPlain: "Plain text with unicode: 🚀 and emojis 😊",
        bodyHtml:
          "<p>HTML with <strong>bold</strong> and <em>italic</em> text</p>",
        reference: "REF-2024-001",
        replyTo: "reply@example.com",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response);

      await sendRequest(request, testSmtpUrl);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);

      expect(requestBody.subject).toBe(
        "Test with special chars: éñç & symbols!"
      );
      expect(requestBody.body_plain).toBe(
        "Plain text with unicode: 🚀 and emojis 😊"
      );
      expect(requestBody.body_html).toBe(
        "<p>HTML with <strong>bold</strong> and <em>italic</em> text</p>"
      );
    });

    it("should handle long email content", async () => {
      const longText = "A".repeat(10000);
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Long Content Test",
        bodyPlain: longText,
        bodyHtml: `<p>${longText}</p>`,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response);

      await sendRequest(request, testSmtpUrl);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);

      expect(requestBody.body_plain).toBe(longText);
      expect(requestBody.body_html).toBe(`<p>${longText}</p>`);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle multiple consecutive requests", async () => {
      const requests: SmtpRequest[] = [
        {
          to: "user1@example.com",
          subject: "First Email",
          bodyPlain: "First message",
          bodyHtml: "<p>First message</p>",
        },
        {
          to: "user2@example.com",
          subject: "Second Email",
          bodyPlain: "Second message",
          bodyHtml: "<p>Second message</p>",
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response);

      await sendRequest(requests[0], testSmtpUrl);
      await sendRequest(requests[1], testSmtpUrl);

      expect(mockFetch).toHaveBeenCalledTimes(2);

      const firstCall = mockFetch.mock.calls[0];
      const secondCall = mockFetch.mock.calls[1];

      const firstBody = JSON.parse(firstCall[1]?.body as string);
      const secondBody = JSON.parse(secondCall[1]?.body as string);

      expect(firstBody.to).toBe("user1@example.com");
      expect(secondBody.to).toBe("user2@example.com");
    });

    it("should handle mixed success and failure scenarios", async () => {
      const request: SmtpRequest = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyPlain: "Plain text body",
        bodyHtml: "<p>HTML body</p>",
      };

      // First call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response);

      await sendRequest(request, testSmtpUrl);

      // Second call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      } as Response);

      await expect(sendRequest(request, testSmtpUrl)).rejects.toThrow(
        "SMTP request failed: Too Many Requests"
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
