// Standard library imports
import { join } from "path";

// Plugin framework imports
import { runPlugin } from "../../lib/plugin";
import type { PluginAPI } from "../../lib/plugin";

// Local imports - handlers
import { createCommandHandler } from "./handlers/command";
import type { CommandHandlerRequest } from "./handlers/command";
import { createInboxHandler } from "./handlers/inbox";
import type { InboxHandlerRequest } from "./handlers/inbox";

// Local imports - services
import { createConfigService, loadConfig } from "./services/config";
import { createProverService } from "./services/prover";
import { createSmtpService } from "./services/smtp";
import { createTemplateService } from "./services/template";
import { createVerifierService } from "./services/verifier";

type PluginRequest =
  | {
      action: "command";
      request: CommandHandlerRequest;
    }
  | {
      action: "inbox";
      request: InboxHandlerRequest;
    };

async function main(
  pluginApi: PluginAPI,
  { action, request }: PluginRequest
): Promise<string> {
  if (!action || !request) {
    throw new Error("Action and request are required");
  }

  const config = await loadConfig(join(__dirname, ".."), "config.json");
  const configService = createConfigService({ config });

  const smtpService = createSmtpService({
    configService,
  });
  const proverService = createProverService({
    configService,
  });
  const verifierService = createVerifierService({
    configService,
    pluginApi: pluginApi,
  });
  const templateService = createTemplateService({
    configService,
  });

  switch (action) {
    case "command":
      return await createCommandHandler({
        smtpService,
        templateService,
      })(request);
    case "inbox":
      return await createInboxHandler({
        smtpService,
        proverService,
        verifierService,
        templateService,
      })(request);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

runPlugin(main);
