import { AppError } from '@/core/errors';

import { createLogger, logBuffer } from './logger';

describe('createLogger', () => {
  beforeEach(() => {
    logBuffer.clear();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('tags every entry with the scope and level', () => {
    createLogger('core/llm').info('model load start', { sizeMb: 1280 });

    expect(logBuffer.entries()).toEqual([
      expect.objectContaining({
        scope: 'core/llm',
        level: 'info',
        message: 'model load start',
        fields: { sizeMb: 1280 },
      }),
    ]);
  });

  it('records the code of a logged AppError', () => {
    const error = new AppError({ code: 'LLM_LOAD_FAILED', message: 'm', userMessage: 'u' });

    createLogger('core/llm').error('load failed', error);

    expect(logBuffer.entries()[0]).toMatchObject({ level: 'error', code: 'LLM_LOAD_FAILED' });
  });

  it('records errors that are not AppErrors without a code', () => {
    createLogger('core/llm').error('load failed', new Error('boom'));

    expect(logBuffer.entries()[0].code).toBeUndefined();
  });
});
