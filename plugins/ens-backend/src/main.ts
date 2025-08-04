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
import { createLoggerService } from "./services/logger";
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

  const loggerService = createLoggerService({
    service: "ens-backend",
    level: process.env.LOG_LEVEL || "info",
    file: {
      enabled: process.env.LOG_TO_FILE !== "false", // Enable by default, disable with LOG_TO_FILE=false
      path:
        process.env.LOG_FILE_PATH ||
        "./plugins/ens-backend/logs/ens-backend.log",
      maxSize: process.env.LOG_MAX_SIZE || "10MB",
      maxFiles: parseInt(process.env.LOG_MAX_FILES || "5"),
    },
  });

  loggerService.info("ENS Backend plugin starting", { action });

  const smtpService = createSmtpService({
    configService,
    loggerService,
  });
  const proverService = createProverService({
    configService,
    loggerService,
  });
  const verifierService = createVerifierService({
    configService,
    pluginApi: pluginApi,
    loggerService,
  });
  const templateService = createTemplateService({
    configService,
    loggerService,
  });

  try {
    switch (action) {
      case "command":
        loggerService.info("Processing command request");
        return await createCommandHandler({
          smtpService,
          templateService,
          loggerService,
        })(request);
      case "inbox":
        loggerService.info("Processing inbox request");
        return await createInboxHandler({
          smtpService,
          proverService,
          verifierService,
          templateService,
          loggerService,
        })(request);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    loggerService.error("Plugin execution failed", error as Error);
    throw error;
  }
}

runPlugin(main);
