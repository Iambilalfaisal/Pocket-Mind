import { appConfig } from '@/core/config';

import { diskFullError } from './storage.errors';
import type { StoredModel } from './storage.types';

/** Throws STORAGE_DISK_FULL unless the model plus the configured headroom fits. */
export function assertEnoughDiskSpace(freeBytes: number, model: StoredModel): void {
  const neededBytes = model.sizeBytes + appConfig.diskHeadroomBytes;
  if (freeBytes < neededBytes) {
    throw diskFullError(neededBytes, freeBytes);
  }
}
