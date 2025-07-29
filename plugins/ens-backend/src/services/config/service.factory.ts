import { createLoad } from "./load.factory";
import { ConfigDeps, ConfigService } from "./types";

export const createConfigService = (deps: ConfigDeps): ConfigService => {
  return {
    load: createLoad(deps),
  };
};
