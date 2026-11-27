import type { ModelCatalogEntry } from '@/core/models';

/** The part of a catalog entry that storage needs. */
export type StoredModel = Pick<ModelCatalogEntry, 'id' | 'url' | 'fileName' | 'sizeBytes'>;

export type DownloadProgress = {
  bytesWritten: number;
  totalBytes: number;
};

export type DownloadResult = { status: 'completed'; uri: string } | { status: 'cancelled' };

/** What the app depends on; screens never touch files or the network directly. */
export type ModelStorage = {
  getModelUri: (model: StoredModel) => string;
  /** True only when the file exists AND its size matches the catalog. */
  isDownloaded: (model: StoredModel) => Promise<boolean>;
  /** One download at a time; rejects with an AppError (STORAGE_*) on failure. */
  download: (
    model: StoredModel,
    onProgress: (progress: DownloadProgress) => void,
  ) => Promise<DownloadResult>;
  cancelDownload: () => Promise<void>;
  delete: (model: StoredModel) => Promise<void>;
  /** Removes `.part` files left by a download that was interrupted. Call once at startup. */
  removeStaleDownloads: () => Promise<void>;
};

export type FileDownloadOutcome = { kind: 'completed'; httpStatus: number } | { kind: 'cancelled' };

export type FileDownload = {
  finished: Promise<FileDownloadOutcome>;
  cancel: () => Promise<void>;
};

/** The seam over the file system and network; modelFiles.ts is the real implementation. */
export type ModelFiles = {
  /** Directory that holds models, ending with `/`. */
  modelsDirectory: string;
  ensureModelsDirectory: () => Promise<void>;
  /** Size in bytes, or null when the file does not exist. */
  sizeOf: (uri: string) => Promise<number | null>;
  freeDiskBytes: () => Promise<number>;
  listModelsDirectory: () => Promise<string[]>;
  /** Does nothing when the file is already gone. */
  remove: (uri: string) => Promise<void>;
  move: (fromUri: string, toUri: string) => Promise<void>;
  /** First `byteCount` bytes as a latin1 string. */
  readHeader: (uri: string, byteCount: number) => Promise<string>;
  startDownload: (
    url: string,
    toUri: string,
    onBytesWritten: (bytesWritten: number) => void,
  ) => FileDownload;
};
