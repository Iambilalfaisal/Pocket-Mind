import { modelCatalog } from './catalog';
import type { ModelCatalogEntry } from './catalog.types';
import { validateCatalog } from './catalogValidation';

const validEntry: ModelCatalogEntry = {
  id: 'test-model',
  displayName: 'Test',
  url: 'https://huggingface.co/acme/test-GGUF/resolve/abc123/test-Q4_K_M.gguf',
  revision: 'abc123',
  fileName: 'test-Q4_K_M.gguf',
  sizeBytes: 1000,
  quantization: 'Q4_K_M',
  license: 'apache-2.0',
  contextDefault: 2048,
  promptFormatNotes: '',
};

const withChanges = (changes: Partial<ModelCatalogEntry>) => ({ ...validEntry, ...changes });

describe('validateCatalog', () => {
  it('accepts the shipped catalog', () => {
    expect(() => validateCatalog(modelCatalog)).not.toThrow();
  });

  it.each([
    ['a non-https url', withChanges({ url: validEntry.url.replace('https', 'http') }), 'https'],
    [
      'a host that is not allowed',
      withChanges({ url: validEntry.url.replace('huggingface.co', 'example.com') }),
      'not allowed',
    ],
    ['an unpinned url', withChanges({ url: validEntry.url.replace('abc123', 'main') }), 'pinned'],
    ['a path in the file name', withChanges({ fileName: '../evil.gguf' }), 'plain .gguf'],
    ['a zero size', withChanges({ sizeBytes: 0 }), 'sizeBytes'],
    ['a fractional context', withChanges({ contextDefault: 2048.5 }), 'contextDefault'],
  ])('rejects %s', (_label, entry, expectedProblem) => {
    expect(() => validateCatalog([entry])).toThrow(expectedProblem);
  });

  it('rejects duplicate ids and file names', () => {
    expect(() => validateCatalog([validEntry, validEntry])).toThrow(/duplicate id/);
    expect(() => validateCatalog([validEntry, validEntry])).toThrow(/duplicate fileName/);
  });

  it('reports the MODELS_CATALOG_INVALID code', () => {
    expect.assertions(1);
    try {
      validateCatalog([withChanges({ sizeBytes: -1 })]);
    } catch (error) {
      expect(error).toMatchObject({ code: 'MODELS_CATALOG_INVALID' });
    }
  });
});
