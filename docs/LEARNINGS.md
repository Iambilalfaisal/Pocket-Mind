# Learnings

Versions chosen, surprises, measurements.

## Phase 0 (2026-11-27)
- Versions: expo 58.1.0, react-native 0.88.1, react 19.3.0, expo-router 58.0.33, llama.rn 0.12.9 (exact), zustand 5.1.0.
- Whether llama.rn 0.12.9 can load Qwen3.5 is **unverified** until a device build.
- The default Expo template ships many native packages outside our freeze list (reanimated, worklets, gesture-handler, expo-image, expo-glass-effect, expo-symbols, expo-font, expo-device, expo-web-browser, @expo/ui, expo-splash-screen, expo-system-ui). All removed.
- `react-dom` is installed at 19.3.0 only because npm auto-installs expo-router's optional peer and it must match `react`.
- On Windows, `npm install llama.rn` fails in its install script (`download-native-artifacts.js`): Git Bash `tar` reads `C:\...` as a remote host. Install locally with `--ignore-scripts`; the script is only needed for native builds, which run on Linux/macOS CI.
- `jest.mock('llama.rn', () => require('llama.rn/jest/mock'))` needs `llama.rn` added to jest `transformIgnorePatterns` (see `jest.config.js`).
