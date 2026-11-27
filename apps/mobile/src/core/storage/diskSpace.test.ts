import { appConfig } from '@/core/config';

import { assertEnoughDiskSpace } from './diskSpace';

const model = { id: 'm', url: 'https://huggingface.co/x', fileName: 'm.gguf', sizeBytes: 1000 };

describe('assertEnoughDiskSpace', () => {
  it('passes when the model plus headroom fits exactly', () => {
    expect(() => assertEnoughDiskSpace(1000 + appConfig.diskHeadroomBytes, model)).not.toThrow();
  });

  it('throws STORAGE_DISK_FULL when the headroom does not fit', () => {
    expect.assertions(1);
    try {
      assertEnoughDiskSpace(1000 + appConfig.diskHeadroomBytes - 1, model);
    } catch (error) {
      expect(error).toMatchObject({ code: 'STORAGE_DISK_FULL' });
    }
  });
});
