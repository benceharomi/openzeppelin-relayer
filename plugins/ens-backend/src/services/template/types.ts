export type TemplateConfig = {
  templateDirPath: string;
};

export type TemplateConfigService = {
  getTemplateConfig: () => TemplateConfig;
};

export type TemplateDeps = {
  configService: TemplateConfigService;
};

export type TemplateArg = Record<string, string>;

export type LoadAndRenderTemplate = (
  fileName: string,
  args: TemplateArg
) => Promise<string>;

export type TemplateService = {
  loadAndRenderTemplate: LoadAndRenderTemplate;
};
