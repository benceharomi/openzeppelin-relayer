export type TemplateDeps = {
  config: TemplateConfig;
};

export type TemplateConfig = {
  templateDirPath: string;
};

export type TemplateArg = Record<string, string>;

export type LoadAndRenderTemplate = (
  fileName: string,
  args: TemplateArg
) => Promise<string>;

export type TemplateService = {
  loadAndRenderTemplate: LoadAndRenderTemplate;
};
