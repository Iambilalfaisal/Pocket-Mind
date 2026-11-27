import { AppError } from '@/core/errors';
import { createLogger } from '@/core/logging';

import { assertEnoughDiskSpace } from './diskSpace';
import { downloadFailedError, invalidFileError, sizeMismatchError } from './storage.errors';
import type { DownloadProgress, DownloadResult, ModelFiles, StoredModel } from './storage.types';

const log = createLogger('core/storage');

const GGUF_MAGIC = 'GGUF';
const HTTP_OK = 200;
const LOG_EVERY_PERCENT = 25;

export const partFileName = (model: StoredModel) => `${model.fileName}.part`;

export type DownloadTask = {
  done: Promise<DownloadResult>;
  cancel: () => Promise<void>;
};

/**
 * Downloads to `<file>.part`, checks status, size and GGUF header, then renames it.
 * A partial or invalid file never ends up at the final path.
 */
export function startModelDownload(
  files: ModelFiles,
  model: StoredModel,
  onProgress: (progress: DownloadProgress) => void,
): DownloadTask {
  const partUri = `${files.modelsDirectory}${partFileName(model)}`;
  const finalUri = `${files.modelsDirectory}${model.fileName}`;
  let cancelRequested = false;
  let activeCancel: (() => Promise<void>) | undefined;

  async function run(): Promise<DownloadResult> {
    const startedAt = Date.now();
    await files.ensureModelsDirectory();
    assertEnoughDiskSpace(await files.freeDiskBytes(), model);
    await files.remove(partUri);
    if (cancelRequested) return { status: 'cancelled' };

    log.info('download start', { modelId: model.id, sizeBytes: model.sizeBytes });
    let nextLogPercent = LOG_EVERY_PERCENT;
    const download = files.startDownload(model.url, partUri, (bytesWritten) => {
      onProgress({ bytesWritten, totalBytes: model.sizeBytes });
      const percent = Math.floor((bytesWritten / model.sizeBytes) * 100);
      while (percent >= nextLogPercent && nextLogPercent < 100) {
        log.info('download progress', { modelId: model.id, percent: nextLogPercent });
        nextLogPercent += LOG_EVERY_PERCENT;
      }
    });
    activeCancel = download.cancel;
    if (cancelRequested) await download.cancel();

    const outcome = await download.finished;
    if (outcome.kind === 'cancelled') {
      await files.remove(partUri);
      log.info('download cancelled', { modelId: model.id });
      return { status: 'cancelled' };
    }
    if (outcome.httpStatus !== HTTP_OK) {
      throw downloadFailedError(`server answered HTTP ${outcome.httpStatus}`);
    }

    const actualBytes = await files.sizeOf(partUri);
    if (actualBytes !== model.sizeBytes) {
      throw sizeMismatchError(model.sizeBytes, actualBytes ?? 0);
    }
    if ((await files.readHeader(partUri, GGUF_MAGIC.length)) !== GGUF_MAGIC) {
      throw invalidFileError();
    }

    await files.move(partUri, finalUri);
    log.info('download end', { modelId: model.id, durationMs: Date.now() - startedAt });
    return { status: 'completed', uri: finalUri };
  }

  const done = run().catch(async (error: unknown) => {
    await files.remove(partUri);
    const appError =
      error instanceof AppError ? error : downloadFailedError('unexpected error', error);
    log.error('download failed', appError);
    throw appError;
  });

  return {
    done,
    cancel: async () => {
      cancelRequested = true;
      await activeCancel?.();
    },
  };
}
