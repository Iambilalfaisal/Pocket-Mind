const MEGABYTE = 1024 * 1024;

export const appConfig = {
  /** Default llama.rn context window; larger values use more memory. */
  contextSize: 2048,
  /** Free space required beyond a model's own size before a download may start. */
  diskHeadroomBytes: 500 * MEGABYTE,
  /** Log entries kept in memory for the Diagnostics screen. */
  logBufferCapacity: 500,
} as const;
