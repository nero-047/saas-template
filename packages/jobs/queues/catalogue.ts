import { z } from 'zod';

import { createJobEnvelopeSchema } from '../types/job.js';

export const PLATFORM_QUEUE_NAMES = {
  email: 'platform-email',
  notification: 'platform-notification',
} as const;

export const PLATFORM_JOB_NAMES = {
  emailSend: 'EMAIL_SEND',
  notificationSend: 'NOTIFICATION_SEND',
} as const;

export const emailSendPayloadSchema = z
  .object({
    to: z.email(),
    subject: z.string().trim().min(1).max(200),
    text: z.string().min(1).max(100_000),
  })
  .strict();

export const notificationSendPayloadSchema = z
  .object({
    recipientUserId: z.uuid(),
    title: z.string().trim().min(1).max(200),
    body: z.string().min(1).max(10_000),
  })
  .strict();

export const emailSendJobSchema = createJobEnvelopeSchema(
  emailSendPayloadSchema,
);
export const notificationSendJobSchema = createJobEnvelopeSchema(
  notificationSendPayloadSchema,
);

export type EmailSendPayload = z.infer<typeof emailSendPayloadSchema>;
export type NotificationSendPayload = z.infer<
  typeof notificationSendPayloadSchema
>;
export type EmailSendJob = z.infer<typeof emailSendJobSchema>;
export type NotificationSendJob = z.infer<typeof notificationSendJobSchema>;

export type PlatformJobName =
  (typeof PLATFORM_JOB_NAMES)[keyof typeof PLATFORM_JOB_NAMES];
export type PlatformJobPayload = {
  readonly EMAIL_SEND: EmailSendPayload;
  readonly NOTIFICATION_SEND: NotificationSendPayload;
};
export type PlatformJobEnvelope = {
  readonly EMAIL_SEND: EmailSendJob;
  readonly NOTIFICATION_SEND: NotificationSendJob;
};

export function queueNameForJob(name: PlatformJobName): string {
  switch (name) {
    case PLATFORM_JOB_NAMES.emailSend:
      return PLATFORM_QUEUE_NAMES.email;
    case PLATFORM_JOB_NAMES.notificationSend:
      return PLATFORM_QUEUE_NAMES.notification;
  }
}

export function parsePlatformJob<TName extends PlatformJobName>(
  name: TName,
  value: unknown,
): PlatformJobEnvelope[TName] {
  switch (name) {
    case PLATFORM_JOB_NAMES.emailSend:
      return emailSendJobSchema.parse(value) as PlatformJobEnvelope[TName];
    case PLATFORM_JOB_NAMES.notificationSend:
      return notificationSendJobSchema.parse(
        value,
      ) as PlatformJobEnvelope[TName];
  }
}
