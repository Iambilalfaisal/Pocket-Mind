export type ModelCatalogEntry = {
  id: string;
  displayName: string;
  /** Must contain `/resolve/<revision>/` so a re-upload upstream cannot change what users get. */
  url: string;
  /** Hugging Face commit SHA the file is pinned to. */
  revision: string;
  fileName: string;
  sizeBytes: number;
  quantization: string;
  license: string;
  contextDefault: number;
  promptFormatNotes: string;
};
