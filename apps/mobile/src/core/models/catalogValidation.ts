import { appConfig } from '@/core/config';

import type { ModelCatalogEntry } from './catalog.types';
import { catalogInvalidError } from './models.errors';

const SAFE_GGUF_FILE_NAME = /^[A-Za-z0-9._-]+\.gguf$/;

function findEntryProblems(entry: ModelCatalogEntry): string[] {
  const problems: string[] = [];
  const problem = (text: string) => problems.push(`${entry.id}: ${text}`);

  let url: URL | undefined;
  try {
    url = new URL(entry.url);
  } catch {
    problem('url is not a valid URL');
  }
  if (url) {
    if (url.protocol !== 'https:') problem('url must use https');
    if (!(appConfig.allowedDownloadHosts as readonly string[]).includes(url.hostname)) {
      problem(`host ${url.hostname} is not allowed`);
    }
    if (!url.pathname.includes(`/resolve/${entry.revision}/`)) {
      problem('url must be pinned to its revision (/resolve/<revision>/)');
    }
    if (!url.pathname.endsWith(`/${entry.fileName}`)) problem('url does not end with fileName');
  }
  if (!SAFE_GGUF_FILE_NAME.test(entry.fileName)) {
    problem('fileName must be a plain .gguf file name');
  }
  if (!Number.isInteger(entry.sizeBytes) || entry.sizeBytes <= 0) {
    problem('sizeBytes must be a positive integer');
  }
  if (!Number.isInteger(entry.contextDefault) || entry.contextDefault <= 0) {
    problem('contextDefault must be a positive integer');
  }
  return problems;
}

function findDuplicates(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

/** Throws MODELS_CATALOG_INVALID listing every problem found. */
export function validateCatalog(entries: readonly ModelCatalogEntry[]): void {
  const problems = [
    ...entries.flatMap(findEntryProblems),
    ...findDuplicates(entries.map((entry) => entry.id)).map((id) => `duplicate id ${id}`),
    ...findDuplicates(entries.map((entry) => entry.fileName)).map(
      (name) => `duplicate fileName ${name}`,
    ),
  ];
  if (problems.length > 0) {
    throw catalogInvalidError(problems);
  }
}
