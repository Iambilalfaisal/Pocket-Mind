import { AppError } from './AppError';

describe('AppError', () => {
  it('carries its code, user message and cause', () => {
    const cause = new Error('disk said no');
    const error = new AppError({
      code: 'STORAGE_DISK_FULL',
      message: 'needed 2 GB, had 1 GB',
      userMessage: 'Not enough free space.',
      cause,
    });

    expect(error.code).toBe('STORAGE_DISK_FULL');
    expect(error.userMessage).toBe('Not enough free space.');
    expect(error.message).toBe('needed 2 GB, had 1 GB');
    expect(error.cause).toBe(cause);
  });

  it('is an Error that can be told apart from other errors', () => {
    const error = new AppError({ code: 'X_FAILED', message: 'm', userMessage: 'u' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(new Error('plain')).not.toBeInstanceOf(AppError);
  });
});
