import { escape } from "html-escaper";
import { CommandHandler, CommandHandlerDeps } from "./types";

export const createCommandHandler =
  ({
    smtpService,
    templateService,
    loggerService,
  }: CommandHandlerDeps): CommandHandler =>
  async (request) => {
    loggerService.info("Command request", request);

    const relayerData = JSON.stringify(request);
    const encodedRelayerData = escape(relayerData);

    await smtpService.sendRequest({
      to: request.email,
      subject: `[Reply Needed] ${request.command}`,
      bodyPlain: request.command,
      bodyHtml: await templateService.loadAndRenderTemplate(
        "command_confirmation.html",
        {
          ["command"]: request.command,
          ["relayer_data"]: encodedRelayerData,
        }
      ),
    });

    return "success";
  };
