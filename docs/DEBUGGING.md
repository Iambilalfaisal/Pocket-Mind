# Debugging

Maps each symptom to the folder or file to open.

| Symptom / error code | Where to look |
|---|---|
| _Filled in as modules and error codes are added._ | |

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
