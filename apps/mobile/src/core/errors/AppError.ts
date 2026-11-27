type AppErrorInit = {
  /** Module-prefixed code, e.g. LLM_LOAD_FAILED; the prefix names the folder to open. */
  code: string;
  /** Developer-facing detail, shown in logs only. */
  message: string;
  /** Friendly text safe to show the user. */
  userMessage: string;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: string;
  readonly userMessage: string;

  constructor({ code, message, userMessage, cause }: AppErrorInit) {
    super(message, { cause });
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
  }
}
