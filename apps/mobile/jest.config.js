const jestExpo = require('jest-expo/jest-preset');

module.exports = {
  preset: 'jest-expo',
  passWithNoTests: true,
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  // llama.rn ships TypeScript source that its own jest mock requires, so it must be transformed.
  transformIgnorePatterns: jestExpo.transformIgnorePatterns.map((pattern) =>
    pattern.replace('(?!(.pnpm|', '(?!(.pnpm|llama.rn|'),
  ),
};
