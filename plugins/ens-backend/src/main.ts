import { join } from "path";
import { commandHandler, CommandHandlerRequest } from "./command-handler";
import { inboxHandler, InboxHandlerRequest } from "./inbox-handler";
import { fromFile } from "./state";
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

  const config = fromFile(join(__dirname, "..", "config.json"));

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
