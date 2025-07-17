import { PluginAPI } from "../../lib/plugin";
import { sendSmtpRequest } from "./smtp";
import { StateConfig } from "./config";
import { CommandRequest } from "./command-request";
import { loadAndRenderCommandConfirmationTemplate } from "./template";

export async function commandHandler(
  api: PluginAPI,
  config: StateConfig,
  params: { commandRequest: CommandRequest }
): Promise<string> {
  if (!params || !params.commandRequest) {
    throw new Error("Request parameter is required");
  }

  const { commandRequest } = params;

  console.info("Command request:", commandRequest);

  await sendSmtpRequest(
    {
      to: commandRequest.email,
      subject: `[Reply Needed] ${commandRequest.command}`,
      bodyPlain: commandRequest.command,
      bodyHtml: loadAndRenderCommandConfirmationTemplate(commandRequest),
    },
    config.smtpUrl
  );

  return "Email sent successfully";
}
