import { readFile } from "fs/promises";
import { LoadAndRenderTemplate, TemplateArg, TemplateDeps } from "./types";
import { existsSync } from "fs";
import { join } from "path";

export const createLoadAndRenderTemplate = (
  deps: TemplateDeps
): LoadAndRenderTemplate => {
  return async (fileName, args) => {
    const template = await loadTemplate(deps.config.templateDirPath, fileName);
    return populateTemplate(template, args);
  };
};

const loadTemplate = async (
  templateDirPath: string,
  fileName: string
): Promise<string> => {
  const templatePath = join(templateDirPath, fileName);

  if (!existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  const template = await readFile(templatePath, "utf8");

  if (!template) {
    throw new Error(`Template file is empty: ${templatePath}`);
  }

  return template;
};

const populateTemplate = (template: string, args: TemplateArg): string => {
  return template.replace(/\{\{(.*?)\}\}/g, (match, p1) => args[p1] || match);
};
