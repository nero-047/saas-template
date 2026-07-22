import { PLATFORM_JOB_NAMES } from '@saas-template/jobs';

import { WorkerContextService } from '../context/worker-context.service';
import { EmailProcessor } from './email.processor';

describe('EmailProcessor', () => {
  it('restores the propagated context while processing', async () => {
    const context = new WorkerContextService();
    const processor = new EmailProcessor(context);
    const run = jest.spyOn(context, 'run');
    const jobContext = {
      requestId: '00000000-0000-4000-8000-000000000001',
      userId: '00000000-0000-4000-8000-000000000002',
      organizationId: '00000000-0000-4000-8000-000000000003',
      workspaceId: '00000000-0000-4000-8000-000000000004',
    };

    await expect(
      processor.process({
        context: jobContext,
        createdAt: '2026-01-01T00:00:00.000Z',
        payload: { to: 'person@example.com', subject: 'Hello', text: 'Body' },
      }),
    ).resolves.toEqual({ status: 'accepted' });

    expect(processor.jobName).toBe(PLATFORM_JOB_NAMES.emailSend);
    expect(run).toHaveBeenCalledWith(jobContext, expect.any(Function));
  });
});
