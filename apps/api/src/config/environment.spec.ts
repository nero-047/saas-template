import { loadApiEnvironment } from './environment';

describe('loadApiEnvironment', () => {
  it('uses the default port when PORT is absent', () => {
    expect(loadApiEnvironment({})).toEqual({ port: 3000 });
  });

  it('parses a valid runtime port', () => {
    expect(loadApiEnvironment({ PORT: '4100' })).toEqual({ port: 4100 });
  });

  it.each(['not-a-port', '0', '65536'])('rejects invalid PORT=%s', (port) => {
    expect(() => loadApiEnvironment({ PORT: port })).toThrow(
      'PORT must be an integer between 1 and 65535.',
    );
  });
});
