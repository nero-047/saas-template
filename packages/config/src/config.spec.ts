import {
  ConfigValidationError,
  parseNeroConfig,
  type NeroProjectConfigInput,
} from './index.js';

const validConfig: NeroProjectConfigInput = {
  project: { name: 'my-app', displayName: 'My App' },
  architecture: 'b2b',
  applications: ['api', 'worker', 'web', 'admin'],
  platform: {
    database: { enabled: true, provider: 'postgresql' },
    queue: { enabled: true, provider: 'bullmq' },
    contracts: { enabled: true, format: 'openapi' },
  },
  features: ['authentication', 'organizations', 'rbac', 'audit', 'jobs'],
};

describe('Nero project configuration', () => {
  it('loads and normalizes a valid configuration', () => {
    expect(parseNeroConfig(validConfig)).toEqual({
      version: 1,
      ...validConfig,
    });
  });

  it('applies conservative blank-project defaults', () => {
    expect(parseNeroConfig({ project: { name: 'blank-project' } })).toEqual({
      version: 1,
      project: { name: 'blank-project' },
      architecture: 'blank',
      applications: [],
      platform: {
        database: { enabled: false, provider: 'postgresql' },
        queue: { enabled: false, provider: 'bullmq' },
        contracts: { enabled: false, format: 'openapi' },
      },
      features: [],
    });
  });

  it.each([
    ['invalid name', { ...validConfig, project: { name: 'Not Valid' } }],
    ['unknown app', { ...validConfig, applications: ['api', 'desktop'] }],
    [
      'unknown feature',
      { ...validConfig, features: ['authentication', 'billing'] },
    ],
    ['unknown property', { ...validConfig, deployment: { provider: 'cloud' } }],
    ['duplicate app', { ...validConfig, applications: ['api', 'api'] }],
  ])('rejects %s configuration', (_name, value) => {
    expect(() => parseNeroConfig(value)).toThrow(ConfigValidationError);
  });
});
