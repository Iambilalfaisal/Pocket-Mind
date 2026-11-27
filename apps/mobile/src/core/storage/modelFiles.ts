import {
  createDownloadResumable,
  deleteAsync,
  documentDirectory,
  EncodingType,
  getFreeDiskStorageAsync,
  getInfoAsync,
  makeDirectoryAsync,
  moveAsync,
  readAsStringAsync,
  readDirectoryAsync,
} from 'expo-file-system/legacy';

import { unavailableError } from './storage.errors';
import type { ModelFiles } from './storage.types';

/**
 * The only file that imports expo-file-system. Kept thin on purpose: all decisions live in
 * downloadTask.ts and modelStorage.ts, which are tested against a fake ModelFiles.
 */
export function createModelFiles(): ModelFiles {
  if (!documentDirectory) throw unavailableError();
  const modelsDirectory = `${documentDirectory}models/`;

  return {
    modelsDirectory,

    ensureModelsDirectory: () => makeDirectoryAsync(modelsDirectory, { intermediates: true }),

    sizeOf: async (uri) => {
      const info = await getInfoAsync(uri);
      return info.exists ? info.size : null;
    },

    freeDiskBytes: getFreeDiskStorageAsync,

    listModelsDirectory: () => readDirectoryAsync(modelsDirectory),

    remove: (uri) => deleteAsync(uri, { idempotent: true }),

    move: (fromUri, toUri) => moveAsync({ from: fromUri, to: toUri }),

    readHeader: async (uri, byteCount) =>
      atob(
        await readAsStringAsync(uri, {
          encoding: EncodingType.Base64,
          position: 0,
          length: byteCount,
        }),
      ),

    startDownload: (url, toUri, onBytesWritten) => {
      const resumable = createDownloadResumable(url, toUri, {}, ({ totalBytesWritten }) =>
        onBytesWritten(totalBytesWritten),
      );
      return {
        finished: resumable
          .downloadAsync()
          .then((result) =>
            result ? { kind: 'completed', httpStatus: result.status } : { kind: 'cancelled' },
          ),
        cancel: () => resumable.cancelAsync(),
      };
    },
  };
}
