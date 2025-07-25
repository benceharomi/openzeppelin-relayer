import { loadAndRenderCommandConfirmationTemplate } from "./template";
import { PluginAPI } from "../../lib/plugin";
import { sendSmtpRequest } from "./smtp";
import { StateConfig } from "./config";

export type CommandHandlerRequest = {
  email: string;
  command: string;
  verifier: string;
};

export async function commandHandler(
  api: PluginAPI,
  config: StateConfig,
  request: CommandHandlerRequest
): Promise<string> {
  if (!request.email) {
    throw new Error("Email parameter is required");
  }

  if (!request.command) {
    throw new Error("Command parameter is required");
  }

  if (!request.verifier) {
    throw new Error("Verifier parameter is required");
  }

  console.info("Received command request");

  await sendSmtpRequest(
    {
      to: request.email,
      subject: `[Reply Needed] ${request.command}`,
      bodyPlain: request.command,
      bodyHtml: loadAndRenderCommandConfirmationTemplate(request),
    },
    config.smtpUrl
  );

  return "Email sent successfully";
}
