import { createLoadAndRenderTemplate } from "./load-and-render-template.factory";
import { TemplateDeps, TemplateService } from "./types";

export const createTemplateService = (deps: TemplateDeps): TemplateService => {
  return {
    loadAndRenderTemplate: createLoadAndRenderTemplate(deps),
  };
};
