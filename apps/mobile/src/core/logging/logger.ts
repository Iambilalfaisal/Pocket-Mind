import { appConfig } from '@/core/config';
import { AppError } from '@/core/errors';

import { LogBuffer } from './LogBuffer';
import type { LogEntry, LogFields, Logger, LogLevel } from './logging.types';

export const logBuffer = new LogBuffer(appConfig.logBufferCapacity);

function record(entry: LogEntry): void {
  logBuffer.push(entry);
  const line = `[${entry.scope}] ${entry.message}${entry.code ? ` (${entry.code})` : ''}`;
  console[entry.level](line, entry.fields ?? '');
}

/**
 * Never pass message text or other user content: log lengths and counts instead.
 * @param scope the folder path of the calling module, e.g. 'core/llm'.
 */
export function createLogger(scope: string): Logger {
  const log = (level: LogLevel, message: string, fields?: LogFields, code?: string) =>
    record({ timestamp: Date.now(), level, scope, message, fields, code });

  return {
    debug: (message, fields) => log('debug', message, fields),
    info: (message, fields) => log('info', message, fields),
    warn: (message, fields) => log('warn', message, fields),
    error: (message, error) =>
      log('error', message, undefined, error instanceof AppError ? error.code : undefined),
  };
}
