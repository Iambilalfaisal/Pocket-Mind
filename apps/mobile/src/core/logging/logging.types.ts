export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Only primitives, so a caller cannot accidentally log an object holding message text. */
export type LogFields = Record<string, string | number | boolean>;

export type LogEntry = {
  timestamp: number;
  level: LogLevel;
  /** Folder path of the module that logged, e.g. core/llm. */
  scope: string;
  message: string;
  /** Set when an AppError was logged. */
  code?: string;
  fields?: LogFields;
};

export type Logger = {
  debug: (message: string, fields?: LogFields) => void;
  info: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  error: (message: string, error?: unknown) => void;
};
