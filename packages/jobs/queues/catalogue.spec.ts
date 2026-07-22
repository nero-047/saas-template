import { emailSendJobSchema, notificationSendJobSchema } from './catalogue.js';

const context = {
  requestId: '00000000-0000-4000-8000-000000000001',
  organizationId: '00000000-0000-4000-8000-000000000002',
};

describe('platform job payloads', () => {
  it('accepts valid email and notification envelopes', () => {
    expect(
      emailSendJobSchema.parse({
        context,
        createdAt: '2026-01-01T00:00:00.000Z',
        payload: { to: 'person@example.com', subject: 'Hello', text: 'Body' },
      }).payload.to,
    ).toBe('person@example.com');

    expect(
      notificationSendJobSchema.parse({
        context,
        createdAt: '2026-01-01T00:00:00.000Z',
        payload: {
          recipientUserId: '00000000-0000-4000-8000-000000000003',
          title: 'Update',
          body: 'Body',
        },
      }).payload.title,
    ).toBe('Update');
  });

  it('rejects malformed payload and context values', () => {
    expect(() =>
      emailSendJobSchema.parse({
        context: { requestId: 'not-a-uuid' },
        createdAt: 'not-a-date',
        payload: { to: 'not-an-email', subject: '', text: '' },
      }),
    ).toThrow();
  });
});
