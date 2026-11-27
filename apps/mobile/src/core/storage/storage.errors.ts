import { AppError } from '@/core/errors';

export function diskFullError(neededBytes: number, freeBytes: number): AppError {
  return new AppError({
    code: 'STORAGE_DISK_FULL',
    message: `Need ${neededBytes} bytes free, only ${freeBytes} available`,
    userMessage: 'Not enough free space on this phone. Free some space and try again.',
  });
}

export function downloadFailedError(detail: string, cause?: unknown): AppError {
  return new AppError({
    code: 'STORAGE_DOWNLOAD_FAILED',
    message: `Download failed: ${detail}`,
    userMessage: 'The download failed. Check your internet connection and try again.',
    cause,
  });
}

export function downloadInProgressError(): AppError {
  return new AppError({
    code: 'STORAGE_DOWNLOAD_IN_PROGRESS',
    message: 'A download is already running',
    userMessage: 'Another model is still downloading. Wait for it or cancel it first.',
  });
}

export function sizeMismatchError(expectedBytes: number, actualBytes: number): AppError {
  return new AppError({
    code: 'STORAGE_SIZE_MISMATCH',
    message: `Expected ${expectedBytes} bytes, got ${actualBytes}`,
    userMessage: 'The downloaded file is incomplete. Please try again.',
  });
}

export function invalidFileError(): AppError {
  return new AppError({
    code: 'STORAGE_INVALID_FILE',
    message: 'Downloaded file does not start with the GGUF magic bytes',
    userMessage: 'The downloaded file is not a valid model. Please try again.',
  });
}

export function unavailableError(): AppError {
  return new AppError({
    code: 'STORAGE_UNAVAILABLE',
    message: 'No document directory on this platform',
    userMessage: 'This device cannot store models.',
  });
}
