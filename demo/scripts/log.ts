// Copyright (C) 2026 West Lane - All Rights Reserved

import {
  createLogger,
  type CreateLoggerOptions,
  type LogThemeId,
  type PBLogger,
} from "@westlane/pino-blanc/browser";
import { currentDemoLogThemeId } from "./theme.js";

const BASE_OPTIONS: CreateLoggerOptions = {
  level: "debug",
  layout: "%lv:5% %md:14% %mt%",
};

const loggers = new Map<string, PBLogger>();

export function getDemoLogger(module: string): PBLogger {
  const cached = loggers.get(module);
  if (cached) {
    return cached;
  }
  const log = createLogger(module, {
    ...BASE_OPTIONS,
    theme: currentDemoLogThemeId() as LogThemeId,
  });
  loggers.set(module, log);
  return log;
}

export function refreshDemoLoggers(): void {
  loggers.clear();
}
