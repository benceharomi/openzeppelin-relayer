import pino from "pino";
import { join } from "path";
import type { LoggerService, LoggerServiceConfig } from "./types";

export function createLoggerService(
  config: LoggerServiceConfig = {}
): LoggerService {
  const {
    level = process.env.LOG_LEVEL || "info",
    prettyPrint = false, // Disabled by default for plugin environment
    service = "ens-backend",
    file = {
      enabled: true,
      path: "logs/ens-backend.log",
      maxSize: "10MB",
      maxFiles: 5,
    },
  } = config;

  // Create a logger that's compatible with the plugin framework
  // Use stderr for pino output to avoid interfering with LogInterceptor
  const logger = pino(
    {
      level,
      base: {
        service,
      },
    },
    pino.destination({ dest: 2, sync: false })
  ); // Write to stderr

  // Create file logger if enabled
  let fileLogger: pino.Logger | null = null;
  if (file.enabled && file.path) {
    try {
      // Create logs directory if it doesn't exist
      const fs = require("fs");
      const path = require("path");
      const logDir = path.dirname(file.path);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Create rotating file logger
      fileLogger = pino(
        {
          level,
          base: {
            service,
            hostname: require("os").hostname(),
            pid: process.pid,
          },
          timestamp: pino.stdTimeFunctions.isoTime,
        },
        pino.destination({
          dest: file.path,
          sync: false,
          mkdir: true,
        })
      );
    } catch (error) {
      console.error(`Failed to initialize file logger: ${error}`);
    }
  }

  // Level hierarchy: error(0) > warn(1) > info(2) > debug(3)
  const levelMap = { error: 0, warn: 1, info: 2, debug: 3 };
  const currentLevel = levelMap[level as keyof typeof levelMap] ?? 2;

  function shouldLog(logLevel: keyof typeof levelMap): boolean {
    return levelMap[logLevel] <= currentLevel;
  }

  function logToFile(
    logLevel: string,
    message: string,
    meta?: Record<string, any>,
    error?: Error
  ) {
    if (!fileLogger) return;

    const logData = { ...meta };
    if (error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    switch (logLevel) {
      case "info":
        fileLogger.info(logData, message);
        break;
      case "warn":
        fileLogger.warn(logData, message);
        break;
      case "error":
        fileLogger.error(logData, message);
        break;
      case "debug":
        fileLogger.debug(logData, message);
        break;
    }
  }

  return {
    info(message: string, meta?: Record<string, any>): void {
      if (shouldLog("info")) {
        // Use console.info which is intercepted by LogInterceptor for structured output
        console.info(`[${service}] ${message}`, meta || {});
        // Also log to file
        logToFile("info", message, meta);
      }
    },

    error(message: string, error?: Error, meta?: Record<string, any>): void {
      if (shouldLog("error")) {
        const logMeta = { ...meta };
        if (error) {
          logMeta.error = {
            message: error.message,
            stack: error.stack,
            name: error.name,
          };
        }
        // Use console.error which is intercepted by LogInterceptor
        console.error(`[${service}] ${message}`, logMeta);
        // Also log to file
        logToFile("error", message, meta, error);
      }
    },

    warn(message: string, meta?: Record<string, any>): void {
      if (shouldLog("warn")) {
        // Use console.warn which is intercepted by LogInterceptor
        console.warn(`[${service}] ${message}`, meta || {});
        // Also log to file
        logToFile("warn", message, meta);
      }
    },

    debug(message: string, meta?: Record<string, any>): void {
      if (shouldLog("debug")) {
        // Use console.debug which is intercepted by LogInterceptor
        console.debug(`[${service}] ${message}`, meta || {});
        // Also log to file
        logToFile("debug", message, meta);
      }
    },

    getLogger() {
      return logger;
    },
  };
}
