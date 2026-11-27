import { logBuffer } from '@/core/logging';

import { startModelDownload } from './downloadTask';
import { createFakeModelFiles } from './fakeModelFiles';

const model = {
  id: 'test-model',
  url: 'https://huggingface.co/acme/test/resolve/abc/test.gguf',
  fileName: 'test.gguf',
  sizeBytes: 1000,
};
const finalName = 'test.gguf';
const partName = 'test.gguf.part';

function setup(freeBytes?: number) {
  const fake = createFakeModelFiles(freeBytes);
  const progress: number[] = [];
  const start = () =>
    startModelDownload(fake.modelFiles, model, ({ bytesWritten }) => progress.push(bytesWritten));
  return { ...fake, progress, start };
}

const fileNames = (files: Map<string, unknown>) =>
  [...files.keys()].map((uri) => uri.split('/').pop());

describe('startModelDownload', () => {
  beforeEach(() => {
    logBuffer.clear();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('promotes the .part file to the final name after a valid download', async () => {
    const t = setup();
    t.scriptNextDownload({ size: 1000, progress: [500, 1000] });

    const result = await t.start().done;

    expect(result).toEqual({ status: 'completed', uri: `${t.modelsDirectory}${finalName}` });
    expect(fileNames(t.files)).toEqual([finalName]);
    expect(t.progress).toEqual([500, 1000]);
  });

  it('logs progress once per 25% step', async () => {
    const t = setup();
    t.scriptNextDownload({ size: 1000, progress: [100, 260, 510, 760, 1000] });

    await t.start().done;

    const percents = logBuffer
      .entries()
      .filter((entry) => entry.message === 'download progress')
      .map((entry) => entry.fields?.percent);
    expect(percents).toEqual([25, 50, 75]);
  });

  it('refuses to start and downloads nothing when the disk is full', async () => {
    const t = setup(1000);
    t.scriptNextDownload({ size: 1000 });

    await expect(t.start().done).rejects.toMatchObject({ code: 'STORAGE_DISK_FULL' });
    expect(t.files.size).toBe(0);
  });

  it('rejects a non-200 response and leaves no file behind', async () => {
    const t = setup();
    t.scriptNextDownload({ size: 1000, httpStatus: 404 });

    await expect(t.start().done).rejects.toMatchObject({ code: 'STORAGE_DOWNLOAD_FAILED' });
    expect(t.files.size).toBe(0);
  });

  it('rejects a size mismatch and never promotes the partial file', async () => {
    const t = setup();
    t.scriptNextDownload({ size: 999 });

    await expect(t.start().done).rejects.toMatchObject({ code: 'STORAGE_SIZE_MISMATCH' });
    expect(fileNames(t.files)).not.toContain(finalName);
    expect(fileNames(t.files)).not.toContain(partName);
  });

  it('rejects a file that is not GGUF even when the size matches', async () => {
    const t = setup();
    t.scriptNextDownload({ size: 1000, header: '<!DO' });

    await expect(t.start().done).rejects.toMatchObject({ code: 'STORAGE_INVALID_FILE' });
    expect(t.files.size).toBe(0);
  });

  it('maps a network error to STORAGE_DOWNLOAD_FAILED with the cause kept', async () => {
    const t = setup();
    const cause = new Error('offline');
    t.scriptNextDownload({ size: 1000, failWith: cause });

    await expect(t.start().done).rejects.toMatchObject({
      code: 'STORAGE_DOWNLOAD_FAILED',
      cause,
    });
    expect(t.files.size).toBe(0);
  });

  it('logs the error code of a failure', async () => {
    const t = setup();
    t.scriptNextDownload({ size: 1, httpStatus: 500 });

    await t.start().done.catch(() => {});

    expect(logBuffer.entries().at(-1)).toMatchObject({
      level: 'error',
      code: 'STORAGE_DOWNLOAD_FAILED',
    });
  });

  it('cancels, removes the .part file and reports cancelled', async () => {
    const t = setup();
    t.scriptNextDownload({ size: 1000, hang: true });
    const task = t.start();
    await new Promise<void>((resolve) => setImmediate(() => resolve()));

    await task.cancel();

    await expect(task.done).resolves.toEqual({ status: 'cancelled' });
    expect(t.files.size).toBe(0);
  });

  it('replaces a stale .part file from an earlier attempt', async () => {
    const t = setup();
    t.putFile(partName, 123, 'xxxx');
    t.scriptNextDownload({ size: 1000 });

    await t.start().done;

    expect(fileNames(t.files)).toEqual([finalName]);
  });
});
