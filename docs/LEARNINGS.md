# Learnings

Versions chosen, surprises, measurements.

## Phase 0 (2026-11-27)
- Versions: expo 58.1.0, react-native 0.88.1, react 19.3.0, expo-router 58.0.33, llama.rn 0.12.9 (exact), zustand 5.1.0.
- Whether llama.rn 0.12.9 can load Qwen3.5 is **unverified** until a device build.
- The default Expo template ships many native packages outside our freeze list (reanimated, worklets, gesture-handler, expo-image, expo-glass-effect, expo-symbols, expo-font, expo-device, expo-web-browser, @expo/ui, expo-splash-screen, expo-system-ui). All removed.
- `react-dom` is installed at 19.3.0 only because npm auto-installs expo-router's optional peer and it must match `react`.
- On Windows, `npm install llama.rn` fails in its install script (`download-native-artifacts.js`): Git Bash `tar` reads `C:\...` as a remote host. Install locally with `--ignore-scripts`; the script is only needed for native builds, which run on Linux/macOS CI.
- `jest.mock('llama.rn', () => require('llama.rn/jest/mock'))` needs `llama.rn` added to jest `transformIgnorePatterns` (see `jest.config.js`).

## Phase 1 (2026-11-27)
- llama.rn 0.12.9's plugin deprecates `enableOpenCL`; we use `enableOpenCLAndHexagon`.
- The plugin adds its memory entitlements only when `NODE_ENV=production` (or a matching EAS profile), and `SIDELOAD=1` turns them off for free-Apple-ID builds. Confirmed locally with `expo config --type introspect`.
- `newArchEnabled` is not an `ExpoConfig` field in SDK 58 (the New Architecture is always on), so it is not set.
- Workflows are untested until their first GitHub run. Runner image and Xcode version used: _record after the first iOS run_.

## Phase 2a: model catalog (2026-11-27)
- Pinned commits: unsloth/Qwen3.5-2B-GGUF `f6d5376`, Qwen/Qwen2.5-1.5B-Instruct-GGUF `91cad51`, bartowski/Llama-3.2-3B-Instruct-GGUF `5ab33fa`. All three pinned URLs resolve (HTTP 200) with the expected `X-Linked-Size`.
- Qwen3.5-2B GGUF metadata: architecture `qwen35`, trained context 262144.
- **Thinking switch (needed by Phase 2b):** the embedded chat template emits `<think>

</think>

` after the assistant header unless `enable_thinking` is defined and true. So thinking is **off by default** with this file; pass `enable_thinking: false` explicitly anyway and still strip `<think>` defensively.
- A request to a `huggingface.co/.../resolve/...` URL redirects (HTTP 302) to a CDN host. The allowlist in `appConfig.allowedDownloadHosts` only checks the catalog URL; the redirect target is outside our control.
