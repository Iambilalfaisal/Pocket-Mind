import { AppError } from '@/core/errors';

export function catalogInvalidError(problems: readonly string[]): AppError {
  return new AppError({
    code: 'MODELS_CATALOG_INVALID',
    message: `Model catalog is invalid: ${problems.join('; ')}`,
    userMessage: 'The model list is broken. Please update the app.',
  });
}
