import type { FileDownloadOutcome, ModelFiles } from './storage.types';

type StoredFile = { size: number; header: string };

/** What the next fake download does. A download with `hang` only ends when cancelled. */
export type DownloadScript = {
  size: number;
  header?: string;
  httpStatus?: number;
  progress?: number[];
  failWith?: Error;
  hang?: boolean;
};

/** In-memory ModelFiles for tests of downloadTask and modelStorage. */
export function createFakeModelFiles(freeBytes = Number.MAX_SAFE_INTEGER) {
  const files = new Map<string, StoredFile>();
  let script: DownloadScript = { size: 0 };
  const modelsDirectory = 'file:///models/';

  const modelFiles: ModelFiles = {
    modelsDirectory,
    ensureModelsDirectory: async () => {},
    sizeOf: async (uri) => files.get(uri)?.size ?? null,
    freeDiskBytes: async () => freeBytes,
    listModelsDirectory: async () =>
      [...files.keys()].map((uri) => uri.slice(modelsDirectory.length)),
    remove: async (uri) => {
      files.delete(uri);
    },
    move: async (fromUri, toUri) => {
      const file = files.get(fromUri);
      if (!file) throw new Error(`no such file ${fromUri}`);
      files.delete(fromUri);
      files.set(toUri, file);
    },
    readHeader: async (uri, byteCount) => (files.get(uri)?.header ?? '').slice(0, byteCount),
    startDownload: (_url, toUri, onBytesWritten) => {
      const current = script;
      let cancel = () => {};
      const cancelled = new Promise<FileDownloadOutcome>((resolve) => {
        cancel = () => resolve({ kind: 'cancelled' });
      });
      const finished = current.hang
        ? cancelled
        : (async (): Promise<FileDownloadOutcome> => {
            current.progress?.forEach(onBytesWritten);
            if (current.failWith) throw current.failWith;
            files.set(toUri, { size: current.size, header: current.header ?? 'GGUF' });
            return { kind: 'completed', httpStatus: current.httpStatus ?? 200 };
          })();
      return {
        finished,
        cancel: async () => {
          if (current.hang) files.set(toUri, { size: 1, header: '' });
          cancel();
        },
      };
    },
  };

  return {
    modelFiles,
    files,
    modelsDirectory,
    scriptNextDownload: (next: DownloadScript) => {
      script = next;
    },
    putFile: (name: string, size: number, header = 'GGUF') =>
      files.set(`${modelsDirectory}${name}`, { size, header }),
  };
}
