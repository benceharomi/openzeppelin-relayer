import { commandHandler } from "./command-handler";
import { inboxHandler } from "./inbox-handler";
import { loadConfig } from "./config";
import { PluginAPI, runPlugin } from "../../lib/plugin";

async function main(api: PluginAPI, params: any): Promise<string> {
  const { action, ...actionParams } = params;

  const config = loadConfig();

  switch (action) {
    case "command":
      return await commandHandler(api, config, actionParams);
    case "inbox":
      return await inboxHandler(api, config, actionParams);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

runPlugin(main);
