const expoConfig = require('eslint-config-expo/flat');

// One native library, one wrapper file (CLAUDE.md, traceability rule 3).
const nativeLibraryWrappers = {
  'llama.rn': 'src/core/llm/llamaRnEngine.ts',
  'expo-file-system': 'src/core/storage/modelFiles.ts',
  'expo-speech': 'src/core/speech/expoSpeechTts.ts',
  'expo-network': 'src/features/connectivity/useOnlineStatus.ts',
};

const moduleIndexOnly = {
  group: ['@/core/*/*', '@/features/*/*', '@/ui/*/*'],
  message: 'Import other modules through their index.ts (e.g. "@/core/llm").',
};

// Layers point one way: app -> features -> core, ui, prompts, i18n.
const layers = [
  {
    files: ['src/core/**'],
    paths: ['react', 'react-native'].map((name) => ({
      name,
      message: 'core/ is plain TypeScript: no React, no UI.',
    })),
    patterns: [
      {
        group: ['@/features', '@/features/*', '@/app', '@/app/*', '@/ui', '@/ui/*'],
        message: 'core/ must not depend on features, app or ui.',
      },
    ],
  },
  {
    files: ['src/features/**', 'src/ui/**', 'src/prompts/**', 'src/i18n/**'],
    paths: [],
    patterns: [{ group: ['@/app', '@/app/*'], message: 'Nothing imports from app/.' }],
  },
];

const restrictedImports = ({ allowedLibrary, paths = [], patterns = [] }) => [
  'error',
  {
    paths: [
      ...Object.entries(nativeLibraryWrappers)
        .filter(([name]) => name !== allowedLibrary)
        .flatMap(([name, wrapper]) =>
          [name, `${name}/*`].map((lib) => ({
            name: lib,
            message: `Only ${wrapper} may import ${name}.`,
          })),
        ),
      ...paths,
    ],
    patterns: [moduleIndexOnly, ...patterns],
  },
];

const wrapperFiles = Object.entries(nativeLibraryWrappers);
const isInLayer = (layer, file) =>
  layer.files.some((glob) => file.startsWith(glob.replace('**', '')));

module.exports = [
  { ignores: ['dist/', '.expo/', 'node_modules/'] },
  ...expoConfig,
  { rules: { 'no-restricted-imports': restrictedImports({}) } },
  ...layers.map(({ files, paths, patterns }) => ({
    files,
    rules: { 'no-restricted-imports': restrictedImports({ paths, patterns }) },
  })),
  // A wrapper keeps its layer's rules but may import its own library.
  ...wrapperFiles.map(([allowedLibrary, file]) => {
    const layer = layers.find((candidate) => isInLayer(candidate, file));
    return {
      files: [file],
      rules: { 'no-restricted-imports': restrictedImports({ allowedLibrary, ...layer }) },
    };
  }),
];
