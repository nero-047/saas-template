import { loadQueueConfig } from './config.js';

describe('loadQueueConfig', () => {
  it('parses an authenticated TLS Redis URL without connecting', () => {
    expect(
      loadQueueConfig({
        REDIS_URL: 'rediss://queue%40user:s%40fe@example.test:6381/2',
        QUEUE_PREFIX: 'test-jobs',
      }),
    ).toEqual({
      connection: {
        host: 'example.test',
        port: 6381,
        username: 'queue@user',
        password: 's@fe',
        db: 2,
        tls: {},
      },
      prefix: 'test-jobs',
    });
  });

  it('requires configuration only when called', () => {
    expect(() => loadQueueConfig({})).toThrow(
      'REDIS_URL is required when queue infrastructure starts.',
    );
  });
});
