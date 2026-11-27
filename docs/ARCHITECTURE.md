# Architecture

Layers point one way: `app/` → `features/` → `core/`, `ui/`, `prompts/`, `i18n/`.

This file gets the layer diagram and three flows traced file by file (send a message, download a model, load a model) as the code for each lands (Phases 2–3).

## Flow: download a model (Phase 2a; the Models screen that calls it comes in Phase 3)

| Step | File | What happens |
|---|---|---|
| 1 | `core/storage/modelStorage.ts` `download()` | Rejects with `STORAGE_DOWNLOAD_IN_PROGRESS` if one is running; otherwise starts a task. |
| 2 | `core/storage/downloadTask.ts` | Creates `models/`, then `diskSpace.ts` requires size + `appConfig.diskHeadroomBytes` free (`STORAGE_DISK_FULL`). Deletes any old `<file>.part`. |
| 3 | `core/storage/modelFiles.ts` | The only file that talks to `expo-file-system`: downloads `url` to `<file>.part`, reporting bytes written. |
| 4 | `core/storage/downloadTask.ts` | Checks HTTP 200 and size equal to the catalog (`STORAGE_DOWNLOAD_FAILED`, `STORAGE_SIZE_MISMATCH`), and that the first 4 bytes are `GGUF` (`STORAGE_INVALID_FILE`). |
| 5 | `core/storage/downloadTask.ts` | Renames `<file>.part` to `<file>`. On any failure or cancel the `.part` is deleted, so a partial file is never at the final path. |

`isDownloaded()` is true only when the final file exists **and** its size equals `sizeBytes`. `removeStaleDownloads()` (to be called once at startup) deletes `.part` files left by a killed app. Logs use scope `core/storage`.
