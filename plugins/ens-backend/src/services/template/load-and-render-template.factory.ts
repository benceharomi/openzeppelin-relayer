import { readFile } from "fs/promises";
import { LoadAndRenderTemplate, TemplateArg, TemplateDeps } from "./types";
import { LoggerService } from "../logger";
import { existsSync } from "fs";
import { join } from "path";

export const createLoadAndRenderTemplate = ({
  configService,
  loggerService,
}: TemplateDeps): LoadAndRenderTemplate => {
  const templateConfig = configService.getTemplateConfig();

  return async (fileName, args) => {
    const logger = loggerService.createChild("load-and-render");
    logger.info("Loading and rendering template", {
      fileName,
      templateDir: templateConfig.templateDirPath,
      argsCount: Object.keys(args).length,
    });

    const template = await loadTemplate({ loggerService })(
      templateConfig.templateDirPath,
      fileName
    );
    const result = populateTemplate({ loggerService })(template, args);

    logger.info("Template rendered successfully", {
      fileName,
      resultLength: result.length,
    });

    return result;
  };
};

const loadTemplate =
  ({ loggerService }: { loggerService: LoggerService }) =>
  async (templateDirPath: string, fileName: string): Promise<string> => {
    const logger = loggerService.createChild("load-template");
    const templatePath = join(templateDirPath, fileName);

    if (!existsSync(templatePath)) {
      logger.error(
        "Template file not found",
        new Error(`Template file not found: ${templatePath}`),
        {
          templatePath,
          fileName,
          templateDirPath,
        }
      );
      throw new Error(`Template file not found: ${templatePath}`);
    }

    logger.debug("Reading template file", {
      templatePath,
      fileName,
    });

    const template = await readFile(templatePath, "utf8");

    if (!template) {
      logger.error(
        "Template file is empty",
        new Error(`Template file is empty: ${templatePath}`),
        {
          templatePath,
          fileName,
        }
      );
      throw new Error(`Template file is empty: ${templatePath}`);
    }

    return template;
  };

const populateTemplate =
  ({ loggerService }: { loggerService: LoggerService }) =>
  (template: string, args: TemplateArg): string => {
    const logger = loggerService.createChild("populate-template");
    const placeholders = template.match(/\{\{(.*?)\}\}/g) || [];

    logger.debug("Populating template placeholders", {
      placeholderCount: placeholders.length,
      placeholders: placeholders.map((p) => p.replace(/[{}]/g, "")),
      availableArgs: Object.keys(args),
    });

    return template.replace(/\{\{(.*?)\}\}/g, (match, p1) => args[p1] || match);
  };
