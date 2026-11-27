import { createModelFiles } from './modelFiles';
import { createModelStorage } from './modelStorage';

/** The app-wide instance, backed by the real file system. */
export const modelStorage = createModelStorage(createModelFiles());
