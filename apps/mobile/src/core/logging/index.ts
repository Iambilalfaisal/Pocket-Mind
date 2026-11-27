// Scoped loggers plus an in-memory buffer of the latest entries for the Diagnostics screen.
// Not responsible for showing logs (features/diagnostics) or for persisting or uploading them.
export { createLogger, logBuffer } from './logger';
export type { LogEntry, LogFields, Logger, LogLevel } from './logging.types';
