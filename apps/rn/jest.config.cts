/// <reference types="jest" />
/// <reference types="node" />
module.exports = {
  displayName: 'rn',
  preset: 'react-native',
  resolver: '@nx/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transform: {
    '^.+[.](js|ts|tsx)$': [
      'babel-jest',
      {
        configFile: __dirname + '/.babelrc.js',
      },
    ],
    '^.+[.](bmp|gif|jpg|jpeg|mp4|png|psd|webp)$': require.resolve(
      'react-native/jest/assetFileTransformer.js',
    ),
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm/.+/node_modules/)?(react-native|@react-native(-community)?)/)',
  ],
  coverageDirectory: '../../coverage/apps/rn',
};
