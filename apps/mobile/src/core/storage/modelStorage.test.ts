import { createFakeModelFiles } from './fakeModelFiles';
import { createModelStorage } from './modelStorage';

const model = {
  id: 'test-model',
  url: 'https://huggingface.co/acme/test/resolve/abc/test.gguf',
  fileName: 'test.gguf',
  sizeBytes: 1000,
};

function setup() {
  const fake = createFakeModelFiles();
  return { ...fake, storage: createModelStorage(fake.modelFiles) };
}

describe('createModelStorage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  describe('isDownloaded', () => {
    it('is false when the file is missing', async () => {
      const { storage } = setup();
      expect(await storage.isDownloaded(model)).toBe(false);
    });

    it('is false when the file exists with the wrong size', async () => {
      const { storage, putFile } = setup();
      putFile('test.gguf', 999);
      expect(await storage.isDownloaded(model)).toBe(false);
    });

    it('is true only when the size matches the catalog', async () => {
      const { storage, putFile } = setup();
      putFile('test.gguf', 1000);
      expect(await storage.isDownloaded(model)).toBe(true);
    });
  });

  describe('download', () => {
    it('allows only one download at a time', async () => {
      const { storage, scriptNextDownload } = setup();
      scriptNextDownload({ size: 1000, hang: true });
      const first = storage.download(model, () => {});
      await new Promise<void>((resolve) => setImmediate(() => resolve()));

      await expect(storage.download(model, () => {})).rejects.toMatchObject({
        code: 'STORAGE_DOWNLOAD_IN_PROGRESS',
      });

      await storage.cancelDownload();
      await expect(first).resolves.toEqual({ status: 'cancelled' });
    });

    it('allows a new download after one failed', async () => {
      const { storage, scriptNextDownload } = setup();
      scriptNextDownload({ size: 1000, httpStatus: 500 });
      await expect(storage.download(model, () => {})).rejects.toMatchObject({
        code: 'STORAGE_DOWNLOAD_FAILED',
      });

      scriptNextDownload({ size: 1000 });

      await expect(storage.download(model, () => {})).resolves.toMatchObject({
        status: 'completed',
      });
      expect(await storage.isDownloaded(model)).toBe(true);
    });
  });

  it('delete removes the model and any partial download', async () => {
    const { storage, files, putFile } = setup();
    putFile('test.gguf', 1000);
    putFile('test.gguf.part', 10);

    await storage.delete(model);

    expect(files.size).toBe(0);
  });

  it('removeStaleDownloads deletes only .part files', async () => {
    const { storage, files, putFile, modelsDirectory } = setup();
    putFile('keep.gguf', 1000);
    putFile('old.gguf.part', 10);

    await storage.removeStaleDownloads();

    expect([...files.keys()]).toEqual([`${modelsDirectory}keep.gguf`]);
  });
});
