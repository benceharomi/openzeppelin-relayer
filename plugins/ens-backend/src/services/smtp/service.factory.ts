import { createSendRequest } from "./send-request.factory";
import type { SmtpService, SmtpDeps } from "./types";

export const createSmtpService = (deps: SmtpDeps): SmtpService => {
  return {
    sendRequest: createSendRequest(deps),
  };
};
