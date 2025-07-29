import { loadAndRenderCommandConfirmationTemplate } from "./template";
import { sendRequest } from "./smtp";
import { StateConfig } from "./state";
import { PluginAPI } from "../../lib/plugin";

export type CommandHandlerRequest = {
  email: string;
  command: string;
  verifier: string;
};

export async function commandHandler(
  api: PluginAPI,
  state: StateConfig,
  request: CommandHandlerRequest
): Promise<string> {
  const htmlBody = loadAndRenderCommandConfirmationTemplate(request);

  console.info("Command request:", request);

  await sendRequest(
    {
      to: request.email,
      subject: `[Reply Needed] ${request.command}`,
      bodyPlain: request.command,
      bodyHtml: htmlBody,
    },
    state.smtpUrl
  );

  return "success";
}
