import { createLogger } from '@/core/logging';

import { partFileName, startModelDownload } from './downloadTask';
import type { DownloadTask } from './downloadTask';
import { downloadInProgressError } from './storage.errors';
import type { ModelFiles, ModelStorage } from './storage.types';

const log = createLogger('core/storage');

const PART_SUFFIX = '.part';

export function createModelStorage(files: ModelFiles): ModelStorage {
  let activeDownload: DownloadTask | undefined;

  const getModelUri: ModelStorage['getModelUri'] = (model) =>
    `${files.modelsDirectory}${model.fileName}`;

  return {
    getModelUri,

    isDownloaded: async (model) => (await files.sizeOf(getModelUri(model))) === model.sizeBytes,

    download: async (model, onProgress) => {
      if (activeDownload) throw downloadInProgressError();
      const task = startModelDownload(files, model, onProgress);
      activeDownload = task;
      try {
        return await task.done;
      } finally {
        activeDownload = undefined;
      }
    },

    cancelDownload: async () => {
      await activeDownload?.cancel();
    },

    delete: async (model) => {
      await files.remove(getModelUri(model));
      await files.remove(`${files.modelsDirectory}${partFileName(model)}`);
      log.info('model deleted', { modelId: model.id });
    },

    removeStaleDownloads: async () => {
      await files.ensureModelsDirectory();
      const names = (await files.listModelsDirectory()).filter((name) =>
        name.endsWith(PART_SUFFIX),
      );
      await Promise.all(names.map((name) => files.remove(`${files.modelsDirectory}${name}`)));
      if (names.length > 0) log.info('removed stale downloads', { count: names.length });
    },
  };
}
