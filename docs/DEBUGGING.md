# Debugging

Maps each symptom to the folder or file to open.

| Symptom / error code | Where to look |
|---|---|
| `MODELS_CATALOG_INVALID` | `core/models/catalogValidation.ts` (the message lists every problem); data is in `catalog.ts` |
| `STORAGE_DISK_FULL` | `core/storage/diskSpace.ts`; headroom is `appConfig.diskHeadroomBytes` |
| `STORAGE_DOWNLOAD_FAILED` | `core/storage/downloadTask.ts`: network error or non-200 answer; the log line has the HTTP status |
| `STORAGE_SIZE_MISMATCH` | `core/storage/downloadTask.ts`: file size differs from `sizeBytes` in `core/models/catalog.ts` (upstream changed, or download cut short) |
| `STORAGE_INVALID_FILE` | `core/storage/downloadTask.ts`: size matched but the file is not GGUF (e.g. an HTML error page) |
| `STORAGE_DOWNLOAD_IN_PROGRESS` | `core/storage/modelStorage.ts`: a second download was started |
| `STORAGE_UNAVAILABLE` | `core/storage/modelFiles.ts`: no document directory (unsupported platform) |
| Model shows "not downloaded" although the file is there | `modelStorage.isDownloaded`: size must equal the catalog's `sizeBytes` |

Also covers: reading the logs (below), getting logs off the phone (Diagnostics → Share), and which workflow step fails for which kind of build error.

## Build failures

| Failing step | Usually means | Look at |
|---|---|---|
| `npm ci` | Lockfile out of sync, or llama.rn could not download its native binaries from GitHub releases | `apps/mobile/package-lock.json`; the step log |
| Lint / Typecheck / Test | Code problem (import-boundary rule, type error, failing test) | The step log shows file and line |
| `npx expo export` | JS bundling failed (bad import, missing asset) | The step log |
| `expo prebuild` | Invalid `app.config.ts` or a config plugin error | `apps/mobile/app.config.ts` |
| `xcodebuild` (iOS) | Native compile or pod error | "Print xcodebuild log tail" step; full `xcodebuild.log` |
| Package .ipa | `.app` not at `build/Build/Products/<build_type>-iphoneos/` | Build step output |
| `gradlew assembleRelease` (Android) | Native compile or Gradle error | The step log |

## Reading the logs
Every line is tagged with a scope that is the folder path of the module that wrote it, e.g. `[core/llm] model load start`. Error lines end with the error code in brackets, e.g. `(STORAGE_DISK_FULL)`; the code prefix names the folder (`STORAGE_` → `core/storage/`). Logs never contain message text, only lengths and counts.

The last 500 entries are kept in memory (`core/logging`, size set in `core/config/appConfig.ts`) and will be shown on the Diagnostics screen (Phase 3). Until that screen exists, logs are visible only in the Metro console during development.

## Downloads: known behaviour
- **Backgrounding (iOS):** `expo-file-system` defaults to a *background* session, so a running download keeps going if the app is backgrounded. If the app is killed, the download is lost; the `.part` file is deleted at next launch and the download starts again from zero. A background session also keeps retrying when the connection drops, instead of failing. The Models screen should still tell the user to keep the app open while downloading.
- **No resume yet:** a retry always starts from byte 0, so a failure at 90% of 1.28 GB costs the whole download. Tracked as a follow-up issue.
- **iCloud backup:** models live in the documents directory, which iOS includes in iCloud backups (1.3 GB per model). `expo-file-system` has no option to exclude a file from backup, and the cache directory is not an alternative because iOS may delete it when space is low. Known issue; tracked as a follow-up issue.
