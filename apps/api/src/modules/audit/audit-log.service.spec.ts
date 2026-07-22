import { ForbiddenException } from '@nestjs/common';

import { RequestContextService } from '../../common/context/request-context.service';
import { AuditLogRepository } from './audit-log.repository';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  const repository = {
    insert: jest.fn(),
    findOrganizationIdsForUser: jest.fn(),
    query: jest.fn(),
  };
  const requestContext = {
    getOptional: jest.fn(),
    requireOrganization: jest.fn(),
  };
  const service = new AuditLogService(
    repository as unknown as AuditLogRepository,
    requestContext as unknown as RequestContextService,
  );
  const context = {
    requestId: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    sessionId: '33333333-3333-4333-8333-333333333333',
    organizationId: '44444444-4444-4444-8444-444444444444',
    workspaceId: '55555555-5555-4555-8555-555555555555',
    permissions: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    requestContext.getOptional.mockReturnValue(context);
    requestContext.requireOrganization.mockReturnValue(context);
    repository.insert.mockImplementation(async (records) =>
      records.map((record: object, index: number) => ({
        id: `audit-${index}`,
        ...record,
      })),
    );
  });

  it('creates an append-only record from the active request context', async () => {
    await service.record({
      action: 'TEST_ACTION',
      resourceType: 'workspace',
      resourceId: context.workspaceId,
    });

    expect(repository.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        userId: context.userId,
        requestId: context.requestId,
        action: 'TEST_ACTION',
        resourceType: 'workspace',
        resourceId: context.workspaceId,
      }),
    ]);
  });

  it('removes sensitive metadata recursively before persistence', async () => {
    await service.record({
      action: 'SAFE_METADATA_TEST',
      resourceType: 'test',
      metadata: {
        result: 'ok',
        password: 'do-not-store',
        sessionToken: 'do-not-store',
        nested: {
          authorization: 'Bearer do-not-store',
          cookie: 'session=do-not-store',
          retained: true,
        },
      },
    });

    expect(repository.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        metadata: {
          result: 'ok',
          nested: { retained: true },
        },
      }),
    ]);
  });

  it('rejects attempts to write into another organization', async () => {
    await expect(
      service.record({
        organizationId: '66666666-6666-4666-8666-666666666666',
        action: 'CROSS_TENANT_ATTEMPT',
        resourceType: 'test',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('queries only the organization and workspace established by context', async () => {
    repository.query.mockResolvedValue([]);

    await service.query({ limit: 500 });

    expect(repository.query).toHaveBeenCalledWith({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      limit: 100,
    });
  });

  it('rejects cross-organization audit queries', async () => {
    await expect(
      service.query({
        organizationId: '66666666-6666-4666-8666-666666666666',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.query).not.toHaveBeenCalled();
  });
});
