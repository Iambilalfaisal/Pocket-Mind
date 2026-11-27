import type { LogEntry } from './logging.types';

/** Fixed-size buffer that drops the oldest entry once full. */
export class LogBuffer {
  private items: LogEntry[] = [];

  constructor(private readonly capacity: number) {}

  push(entry: LogEntry): void {
    this.items.push(entry);
    if (this.items.length > this.capacity) {
      this.items.shift();
    }
  }

  /** Oldest first. */
  entries(): readonly LogEntry[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }
}
