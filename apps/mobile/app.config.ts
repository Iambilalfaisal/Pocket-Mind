import type { ExpoConfig } from 'expo/config';

// Free Apple IDs cannot sign the memory entitlements llama.rn adds, so sideload builds drop them.
const enableEntitlements = process.env.SIDELOAD !== '1';

const config: ExpoConfig = {
  name: 'PocketMind',
  slug: 'pocketmind',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'pocketmind',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.bilalfaisal.pocketmind',
    infoPlist: {
      NSMicrophoneUsageDescription:
        'PocketMind uses the microphone so you can speak your messages to your English coach.',
    },
  },
  android: {
    package: 'com.bilalfaisal.pocketmind',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  plugins: [
    'expo-router',
    ['llama.rn', { enableEntitlements, forceCxx20: true, enableOpenCLAndHexagon: true }],
  ],
  experiments: { typedRoutes: true },
};

export default config;
