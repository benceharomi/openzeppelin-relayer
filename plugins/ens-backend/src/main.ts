import { commandHandler, CommandHandlerRequest } from "./command-handler";
import { inboxHandler, InboxHandlerRequest } from "./inbox-handler";
import { loadConfig } from "./config";
import { PluginAPI, runPlugin } from "../../lib/plugin";

type Params =
  | {
      action: "command";
      request: CommandHandlerRequest;
    }
  | {
      action: "inbox";
      request: InboxHandlerRequest;
    };

async function main(
  api: PluginAPI,
  { action, request }: Params
): Promise<string> {
  if (!action || !request) {
    throw new Error("Action and request are required");
  }

  const config = loadConfig();

  switch (action) {
    case "command":
      return await commandHandler(api, config, request);
    case "inbox":
      return await inboxHandler(api, config, request);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

runPlugin(main);
