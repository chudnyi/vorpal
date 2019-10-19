module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testMatch: ['**/*.spec.ts'],
  globals: {
    'ts-jest': {
      diagnostics: false, // tMP
      tsConfig: 'tsconfig.json',
    },
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-reports',
        suiteNameTemplate: '{filename}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],
};