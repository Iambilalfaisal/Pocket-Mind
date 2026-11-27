import { LogBuffer } from './LogBuffer';
import type { LogEntry } from './logging.types';

const entry = (message: string): LogEntry => ({
  timestamp: 0,
  level: 'info',
  scope: 'core/test',
  message,
});

describe('LogBuffer', () => {
  it('keeps entries oldest first', () => {
    const buffer = new LogBuffer(3);
    buffer.push(entry('a'));
    buffer.push(entry('b'));

    expect(buffer.entries().map((e) => e.message)).toEqual(['a', 'b']);
  });

  it('drops the oldest entries once over capacity', () => {
    const buffer = new LogBuffer(2);
    ['a', 'b', 'c'].forEach((message) => buffer.push(entry(message)));

    expect(buffer.entries().map((e) => e.message)).toEqual(['b', 'c']);
  });

  it('can be cleared', () => {
    const buffer = new LogBuffer(2);
    buffer.push(entry('a'));
    buffer.clear();

    expect(buffer.entries()).toEqual([]);
  });
});
