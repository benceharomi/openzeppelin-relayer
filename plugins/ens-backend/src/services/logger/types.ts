import type { Logger } from "pino";

export type LoggerConfig = {
  service: string;
  level: string;
  file: {
    enabled: boolean;
    path: string;
    maxSize: string;
    maxFiles: number;
  };
};

export type LoggerConfigService = {
  getLoggerConfig: () => LoggerConfig;
};

export type LoggerDeps = {
  configService: LoggerConfigService;
};

export type LoggerService = {
  info(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  getLogger(): Logger;
  createChild(context: string): LoggerService;
};
