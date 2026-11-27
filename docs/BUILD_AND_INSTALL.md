# Build and install

All native builds run in GitHub Actions. Nothing native is built on the developer's Windows machine.

| Workflow | Runs on | Trigger | Output |
|---|---|---|---|
| `mobile-ci` | ubuntu | push to `main`, any PR touching `apps/mobile/**` | pass/fail (required check on `main`) |
| `mobile-ios` | macOS | manual, input `build_type` | `PocketMind-<Debug\|Release>.ipa` artifact |
| `mobile-android` | ubuntu | manual | `PocketMind-apk` artifact (arm64-v8a, x86_64) |

## Build an iOS .ipa
1. GitHub → Actions → **mobile-ios** → Run workflow → pick the branch and `build_type`. Use **Release** for demos: it embeds the JS bundle. **Debug** expects a Metro server.
2. When it finishes, download the `PocketMind-<build_type>-ipa` artifact and unzip it.
3. The `.ipa` is unsigned, built with `SIDELOAD=1` (no memory entitlements, because a free Apple ID cannot sign them).

## Install with Sideloadly (Windows)
1. Install Sideloadly and iTunes/Apple Devices drivers; connect the iPhone and tap Trust.
2. Drag the `.ipa` into Sideloadly, enter your Apple ID, press Start.
3. On the iPhone: Settings → General → VPN & Device Management → trust your Apple ID. Enable Developer Mode if asked (Settings → Privacy & Security).
4. A free Apple ID certificate expires after **7 days**; re-sideload to renew.

## Build an Android APK
Run **mobile-android**, then download the `PocketMind-apk` artifact. Expo's generated project signs release builds with the debug keystore, which is enough to install on a test device.

## When a build fails
See "Build failures" in [DEBUGGING.md](DEBUGGING.md).
