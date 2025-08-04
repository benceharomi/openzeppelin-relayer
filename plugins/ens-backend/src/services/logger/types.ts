import type { Logger } from "pino";

export interface LoggerService {
  info(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  getLogger(): Logger;
}

export interface LoggerServiceConfig {
  level?: string;
  prettyPrint?: boolean;
  service?: string;
  file?: {
    enabled?: boolean;
    path?: string;
    maxSize?: string;
    maxFiles?: number;
    rotationTime?: string;
  };
}
