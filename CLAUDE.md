# PocketMind — project brief for Claude Code

PocketMind runs a small language model fully on the phone (iOS + Android), with no internet after a one-time model download. First use case: an offline **Spoken English Coach** for school students (Pakistan + US). It is a POC that will grow into a school product: build it small, clean and correct.

**First demo:** Sunday, Nov 29, 2026 — the app chatting (and reading replies aloud) in Airplane Mode on an iPhone 14 Pro.

Git workflow, PR rules and the quality bar: @docs/CONTRIBUTING.md (follow it strictly). If `apps/mobile/AGENTS.md` exists (created by create-expo-app), read it too.

## Guiding principle: quality over quantity

Write the least code that solves the problem correctly and clearly. Every file, function and dependency must earn its place. No placeholder code, no speculative abstractions, no commented-out code, no TODOs without a linked issue. A small, well-tested, well-named codebase beats a large one.

## Repository layout (monorepo)

```
pocketmind/
  CLAUDE.md
  README.md
  apps/
    mobile/        Expo app (TypeScript). Standalone npm project with its own package.json and lockfile.
  ml/              Python: datasets, fine-tuning, GGUF export, evaluation. Stage 2 — do NOT create yet.
  services/        Future backend (Python / FastAPI). Do NOT create until a real need is approved.
  docs/
  .github/
```

- There is no backend now, by design: all inference runs on the device.
- No npm workspaces until a second JS package actually exists.
- Run all mobile commands from `apps/mobile/`.

## Environment constraints

- The developer works on **Windows**. No Mac, no Xcode, no iOS Simulator.
- iOS builds happen only in **GitHub Actions** (macOS runner) as an unsigned `.ipa`, installed with **Sideloadly** (free Apple ID). TestFlight comes later.
- Test device: **iPhone 14 Pro** (6 GB RAM, A16, iOS 26). llama.rn's Metal backend does not run in the iOS Simulator anyway.
- npm scripts must work on Windows (no `VAR=1 cmd` syntax, no bash-only scripts). Build env vars live in workflow files.
- You cannot verify native builds locally. Never claim the app "works" on a device; state exactly what you verified (lint, typecheck, tests, JS bundle export) and what still needs a cloud build.

## Mobile stack (decided — do not change without asking)

| Layer | Choice |
|---|---|
| Framework | Expo SDK 58, React Native 0.88, React 19, TypeScript strict, New Architecture |
| Navigation | expo-router (routes in `src/app/`) |
| State | Zustand (one store per feature) |
| AI runtime | llama.rn (llama.cpp binding), GGUF models |
| Main model | Qwen3.5 2B, Q4_K_M GGUF (~1.2 GB), thinking mode OFF |
| Fallback models | Qwen2.5 1.5B Instruct Q4_K_M; Llama 3.2 3B Instruct Q4_K_M (comparison) |
| Text-to-speech | expo-speech (OS voices, offline) |
| Speech-to-text | whisper.rn — later phase, not now |
| Files / downloads | expo-file-system (`expo-file-system/legacy` for `createDownloadResumable`) |
| Offline badge | expo-network (`useNetworkState`) |

### Native dependency freeze

Each native dependency change needs a new cloud build and re-sideload. The native set is fixed: llama.rn, expo-file-system, expo-network, expo-dev-client, expo-build-properties, expo-speech, react-native-safe-area-context, and what expo-router requires (react-native-screens, expo-linking, expo-constants, expo-status-bar). **Ask before adding any other package with native code.** Pure-JS packages need a one-line justification in the PR.

### llama.rn notes

- Requires the New Architecture. Expo config plugin: `['llama.rn', { enableEntitlements, forceCxx20: true, enableOpenCL: true }]`. `enableEntitlements` is `false` when `process.env.SIDELOAD === '1'`, `true` otherwise.
- `initLlama({ model, n_ctx, n_gpu_layers: 99 })`; `context.completion({ messages, n_predict, stop, temperature, ... }, onPartial)` returns text and timings; also `stopCompletion()`, `tokenize()`, `release()`.
- Jest mock: `jest.mock('llama.rn', () => require('llama.rn/jest/mock'))`.
- Android supports arm64-v8a and x86_64 only.
- Pin a stable version. Qwen3.5 needs a recent llama.cpp. If the stable llama.rn cannot load Qwen3.5, report it with options (newer version vs. Qwen2.5 1.5B). **Never switch silently.**
- Qwen3.5 thinking must be OFF: find the supported option in llama.rn (e.g. `chat_template_kwargs: { enable_thinking: false }` or a reasoning setting) and strip any `<think>...</think>` text defensively.
- **Never guess APIs** — for any library, read its types/README in `node_modules` before use.

## Mobile architecture (`apps/mobile/`)

**Design goal:** from any symptom, error code or log line, the developer can tell the exact folder — and usually the exact file — to open. Optimise for readability and debuggability over cleverness.

```
src/
  app/                      Routes only (expo-router). One file per screen; renders a feature screen, nothing else.
    _layout.tsx             Root: error boundary, theme, safe area
    index.tsx               -> features/chat
    models.tsx              -> features/models
    diagnostics.tsx         -> features/diagnostics
  features/                 What the user sees and does. Every feature has the SAME shape:
    chat/
      components/           ChatScreen.tsx, MessageList.tsx, MessageBubble.tsx, Composer.tsx, StatsBar.tsx
      hooks/                useChat.ts (send, stop, batched streaming)
      chat.store.ts         Zustand state for this feature only
      chat.types.ts
      index.ts              Public API — the only import path for other modules
    models/                 Model list, download progress, select / delete
    connectivity/           useOnlineStatus.ts (the ONLY file importing expo-network), OfflineBadge.tsx
    diagnostics/            Log viewer, device/build info, share logs
  core/                     How things work underneath. No React, no UI. Every module has an index.ts.
    llm/
      LLMEngine.ts          Interface the app depends on
      llamaRnEngine.ts      The ONLY file importing llama.rn
      engineManager.ts      Load/unload lifecycle, one generation at a time, stop on background
      historyBudget.ts      Fits chat history into the context window
      thinkStripper.ts      Removes <think> blocks
      llm.types.ts
      llm.errors.ts         LLM_* error codes
    speech/                 TextToSpeech.ts, expoSpeechTts.ts (ONLY file importing expo-speech), speech.errors.ts
    storage/                modelFiles.ts (ONLY file importing expo-file-system), downloadTask.ts, diskSpace.ts, storage.errors.ts
    models/                 catalog.ts (data), catalog.types.ts, catalogValidation.ts, models.errors.ts (MODELS_* codes)
    metrics/                generationMetrics.ts
    logging/                logger.ts — scoped loggers + in-memory ring buffer
    errors/                 AppError.ts — base class with code, userMessage, cause
    config/                 appConfig.ts — n_ctx, limits, feature flags
  prompts/                  coach.v1.ts, general.v1.ts, index.ts
  ui/                       theme/ (tokens, light/dark) and components/ (Screen, Button, Badge, ProgressBar)
  i18n/                     en.ts — every user-facing string
```

### Traceability conventions (mandatory)

1. **Same shape everywhere.** Apply it to the parts a feature or module actually has; never create empty files to fill the shape. Every feature: `components/`, `hooks/`, `<name>.store.ts`, `<name>.types.ts`, `index.ts`. Every core module: implementation files, `<name>.types.ts`, `<name>.errors.ts` when it can fail, `index.ts`.
2. **File names say what is inside.** `*.store.ts`, `*.types.ts`, `*.errors.ts`, `*.test.ts`, hooks `use*.ts`, components PascalCase `.tsx`. One main export per file; file name matches the export.
3. **One native library, one file.** Each third-party native library is imported in exactly one wrapper file (listed above). Nothing else may import it — enforce with ESLint `no-restricted-imports`.
4. **Imports between modules go through `index.ts` only.** Enforce with ESLint. Dependency direction: `app/ -> features/ -> core/, ui/, prompts/, i18n/`. Never reverse. `core/` never imports React or features.
5. **Module headers.** Each `index.ts` starts with a 2–3 line comment: what this module is responsible for, and what it is not.
6. **Error codes name their module.** `LLM_LOAD_FAILED`, `LLM_CONTEXT_OVERFLOW`, `STORAGE_DISK_FULL`, `STORAGE_DOWNLOAD_FAILED`, `SPEECH_TTS_UNAVAILABLE`, `MODELS_CATALOG_INVALID`, etc. The prefix maps to the folder. Error UI shows the friendly message plus the code in small text.
7. **Scoped logging.** `const log = createLogger('core/llm')` — the scope is the folder path, so every log line points to its folder. Log lifecycle events: model load start/end (ms), generation start / first token / end (tokens/sec), download start / every 25% / end, and every error with its code. **Never log message text — only lengths (privacy).**
8. **Diagnostics screen.** There is no Xcode console on Windows and release builds have no Metro, so the logger keeps the last ~500 entries in memory. The Diagnostics screen shows them with app version, build type, selected model, llama.rn version and OS, plus a Share button (React Native `Share`; no new native dependency).
9. **Tests sit next to the code they test** (`historyBudget.ts` + `historyBudget.test.ts`).
10. **Use the `@/` alias** for `src/` imports.

### Living docs (update in every PR that changes behaviour)

- `docs/ARCHITECTURE.md` — layer diagram plus the three main flows traced file by file: send a message, download a model, load a model.
- `docs/DEBUGGING.md` — symptom -> where to look table, how to read the logs, how to get logs off the phone (Diagnostics -> Share), and which workflow step fails for which kind of build error.

Screens reach services only through the `LLMEngine`, `TextToSpeech` and `ModelStorage` interfaces — the seam for a different runtime, a fine-tuned model or a future backend.

## Stability rules (on-device AI crashes from memory, not traffic)

- **One engine at a time.** A single manager owns the llama.rn context; release before loading another model; one generation at a time.
- **Memory safety.** Default `n_ctx` 2048 (configurable). Load failures produce a clear message suggesting a smaller model. Stop generation when the app goes to the background.
- **Context budget.** Trim history by token count (`tokenize`), always keep the system prompt, reserve room for the reply.
- **Smooth streaming.** Batch streamed tokens into UI updates (~50 ms); memoized rows in a FlatList.
- **Robust downloads.** Check free disk space; download to `<file>.part`, rename on success; verify size against the catalog; cancel and retry; never load a partial file.
- **Data-driven.** Catalog and prompts are versioned data, so a new or fine-tuned model is a data change.
- **No silent failures.** Async boundaries map errors to `AppError`; root error boundary.
- **Privacy.** Only network calls: model downloads from allowlisted hosts (huggingface.co). No analytics or telemetry.

## Model catalog (verify before committing)

Entry fields: `id`, `displayName`, `url`, `fileName`, `sizeBytes`, `quantization`, `license`, `contextDefault`, `promptFormatNotes`.

- `qwen3.5-2b` — find the exact Q4_K_M GGUF on Hugging Face (prefer the official Qwen org, else unsloth, bartowski or ggml-org); record URL and byte size from the HF API.
- `qwen2.5-1.5b` — https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf
- `llama3.2-3b` — https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf

## Product behaviour (first demo)

- **Models screen:** catalog list with size and status; download (with progress), cancel, delete, select.
- **Chat screen:** English Coach / General mode, streaming replies, Stop, "Read replies aloud" toggle, offline badge ("No internet — running on this phone"), stats line (model, load time, time to first token, tokens/sec).
- **English Coach prompt:** friendly coach for ages 11–16; replies under 60 words; mistakes → start with "Small fix:" and the corrected sentence; end with one simple question; never does homework.
- Light and dark mode; accessible labels and touch targets.

## CI/CD

All workflows use path filters and `working-directory` so mobile and (later) ml run independently.

- **`mobile-ci.yml`** (ubuntu; push + PR touching `apps/mobile/**`): `npm ci` → lint → typecheck → test → `npx expo export` for ios and android. Required status check on `main`. The job must be named exactly `mobile-ci`, or branch protection cannot find it.
- **`mobile-ios.yml`** (macOS; manual, input `build_type: Debug | Release`): newest non-beta Xcode, Node 22, `npm ci`, `SIDELOAD=1`, `npx expo prebuild --platform ios`, `xcodebuild` for `generic/platform=iOS` with `CODE_SIGNING_ALLOWED=NO`, package `Payload/` → `PocketMind-<build_type>.ipa`, upload artifact, print log tail on failure.
- **`mobile-android.yml`** (ubuntu; manual): Node 22, JDK 17, `npx expo prebuild --platform android`, `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64`, upload APK.
- npm cache keyed on `apps/mobile/package-lock.json`; one concurrency group per workflow.
- `ios/` and `android/` are generated in CI — **never commit them**.

## Working agreement

- Follow `docs/CONTRIBUTING.md`: never commit to `main`; one branch per task; Conventional Commits; push the branch and open a PR with the template (use `gh pr create` if the GitHub CLI is available). **Never merge, force-push or delete branches** — the developer reviews and merges.
- Plan before executing anything that touches more than a few files.
- At the end of each task, stop and report: what changed, how it was verified, what the developer must do next, open decisions.
- If anything in this file is wrong or outdated, say so and propose a fix; don't work around it silently.
- Record notable findings (versions chosen, surprises, measurements) in `docs/LEARNINGS.md`.

## Phases → branches

| # | Phase | Branch |
|---|---|---|
| 0 | Scaffold & tooling: Expo app in `apps/mobile`, deps, strict TS, `@/` alias, ESLint (incl. the import-boundary rules), Prettier, jest-expo, `.gitattributes`, `.gitignore`, docs stubs (ARCHITECTURE, DEBUGGING, DECISIONS, LEARNINGS). Create folders only when they get real code | `chore/mobile-scaffold` |
| 1 | Build pipelines: `app.config.ts` (PocketMind, slug `pocketmind`, id `com.bilalfaisal.pocketmind`, llama.rn plugin with SIDELOAD switch, iOS mic usage string), three workflows, `docs/BUILD_AND_INSTALL.md`, minimal placeholder screen for the first sideload | `ci/mobile-build-pipelines` |
| 2a | Model catalog + storage/downloads | `feat/model-storage` |
| 2b | Logger, AppError, LLM engine, history budgeting, think stripping, prompts, metrics | `feat/llm-engine` |
| 2c | TTS service | `feat/tts` |
| 3 | Models screen, chat screen, offline badge, stats, theme, diagnostics screen | `feat/models-screen`, `feat/chat-screen`, `feat/diagnostics-screen` |
| 4 | Hardening: AppState, low memory, load failures, Android check | `fix/...` / `feat/hardening` |
| 5 | Voice input with whisper.rn (needs approval) | `feat/voice-input` |
| 6 | Demo release v0.1.0: release checklist, measurements, LEARNINGS summary | `chore/release-v0.1.0` |

**Stage 2 (after the demo):** `ml/` Python project — see `docs/CONTRIBUTING.md` for its standards.
