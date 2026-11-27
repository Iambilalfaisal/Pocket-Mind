import type { ModelCatalogEntry } from './catalog.types';

const huggingFaceFile = (repo: string, revision: string, fileName: string) =>
  `https://huggingface.co/${repo}/resolve/${revision}/${fileName}`;

const QWEN_3_5_REVISION = 'f6d5376be1edb4d416d56da11e5397a961aca8ae';
const QWEN_2_5_REVISION = '91cad51170dc346986eccefdc2dd33a9da36ead9';
const LLAMA_3_2_REVISION = '5ab33fa94d1d04e903623ae72c95d1696f09f9e8';

export const modelCatalog: readonly ModelCatalogEntry[] = [
  {
    id: 'qwen3.5-2b',
    displayName: 'Qwen3.5 2B',
    url: huggingFaceFile('unsloth/Qwen3.5-2B-GGUF', QWEN_3_5_REVISION, 'Qwen3.5-2B-Q4_K_M.gguf'),
    revision: QWEN_3_5_REVISION,
    fileName: 'Qwen3.5-2B-Q4_K_M.gguf',
    sizeBytes: 1_280_835_840,
    quantization: 'Q4_K_M',
    license: 'apache-2.0',
    contextDefault: 2048,
    promptFormatNotes:
      'ChatML. Thinking is off unless enable_thinking is true: the template then emits an empty think block.',
  },
  {
    id: 'qwen2.5-1.5b',
    displayName: 'Qwen2.5 1.5B Instruct',
    url: huggingFaceFile(
      'Qwen/Qwen2.5-1.5B-Instruct-GGUF',
      QWEN_2_5_REVISION,
      'qwen2.5-1.5b-instruct-q4_k_m.gguf',
    ),
    revision: QWEN_2_5_REVISION,
    fileName: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
    sizeBytes: 1_117_320_736,
    quantization: 'Q4_K_M',
    license: 'apache-2.0',
    contextDefault: 2048,
    promptFormatNotes: 'ChatML. No thinking mode.',
  },
  {
    id: 'llama3.2-3b',
    displayName: 'Llama 3.2 3B Instruct',
    url: huggingFaceFile(
      'bartowski/Llama-3.2-3B-Instruct-GGUF',
      LLAMA_3_2_REVISION,
      'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    ),
    revision: LLAMA_3_2_REVISION,
    fileName: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    sizeBytes: 2_019_377_696,
    quantization: 'Q4_K_M',
    license: 'llama3.2',
    contextDefault: 2048,
    promptFormatNotes:
      'Llama 3 header format. Comparison model only (Llama 3.2 Community License).',
  },
];
