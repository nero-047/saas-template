const { readFileSync } = require('fs');

const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf8'),
);
swcJestConfig.swcrc = false;

module.exports = {
  displayName: 'api-client',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: 'test-output/jest/coverage',
};
