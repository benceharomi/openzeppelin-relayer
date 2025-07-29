import { join } from "path";
import { createInboxHandler } from "./handlers/inbox/handler.factory";
import { PluginAPI, runPlugin } from "../../lib/plugin";
import { createSmtpService } from "./services/smtp";
import { createProverService } from "./services/prover/service.factory";
import { createVerifierService } from "./services/verifier/service.factory";
import { createCommandHandler } from "./handlers/command";
import { CommandHandlerRequest } from "./handlers/command";
import { InboxHandlerRequest } from "./handlers/inbox";
import { createTemplateService } from "./services/template";
import { createConfigService } from "./services/config";

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

  const configService = createConfigService({
    libDirPath: join(__dirname, ".."),
    configFileName: "config.json",
  });

  const config = configService.load();

  const smtpService = createSmtpService({
    config: config.smtp,
  });
  const proverService = createProverService({
    config: config.prover,
  });
  const verifierService = createVerifierService({
    config: config.verifier,
    pluginApi: pluginApi,
  });
  const templateService = createTemplateService({
    config: config.template,
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
