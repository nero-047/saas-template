import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuditLog, AuditMetadata, NewAuditLog } from '@saas-template/db';

import { RequestContextService } from '../../common/context/request-context.service';
import { sanitizeAuditMetadata } from './audit-metadata';
import { AuditLogRepository, type AuditLogQuery } from './audit-log.repository';

export interface RecordAuditLogInput {
  readonly organizationId?: string;
  readonly workspaceId?: string | null;
  readonly userId?: string | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string | null;
  readonly requestId?: string | null;
  readonly metadata?: AuditMetadata | null;
  readonly createdAt?: Date;
}

export interface QueryAuditLogsInput {
  readonly organizationId?: string;
  readonly workspaceId?: string | null;
  readonly limit?: number;
}

export interface RecordUserOrganizationAuditInput
  extends Omit<
    RecordAuditLogInput,
    'organizationId' | 'workspaceId' | 'userId'
  > {
  readonly userId: string;
}

function explicitOrContext<T>(explicit: T | undefined, contextual: T): T {
  return explicit === undefined ? contextual : explicit;
}

@Injectable()
export class AuditLogService {
  constructor(
    private readonly repository: AuditLogRepository,
    private readonly requestContext: RequestContextService,
  ) {}

  async record(input: RecordAuditLogInput): Promise<AuditLog> {
    const context = this.requestContext.getOptional();
    const organizationId = input.organizationId ?? context?.organizationId;
    if (!organizationId) {
      throw new Error('Audit records require an organization scope.');
    }
    if (context?.organizationId && context.organizationId !== organizationId) {
      throw new ForbiddenException('Cross-organization audit access denied.');
    }
    const [record] = await this.repository.insert([
      this.toRecord(input, {
        organizationId,
        workspaceId: context?.workspaceId ?? null,
        userId: context?.userId ?? null,
        requestId: context?.requestId ?? null,
      }),
    ]);
    if (!record) {
      throw new Error('Audit insertion did not return a row.');
    }
    return record;
  }

  async recordForUserOrganizations(
    input: RecordUserOrganizationAuditInput,
  ): Promise<readonly AuditLog[]> {
    const organizationIds = [
      ...new Set(
        await this.repository.findOrganizationIdsForUser(input.userId),
      ),
    ];
    if (organizationIds.length === 0) {
      return [];
    }
    const context = this.requestContext.getOptional();
    return this.repository.insert(
      organizationIds.map((organizationId) =>
        this.toRecord(
          { ...input, organizationId, workspaceId: null },
          {
            organizationId,
            workspaceId: null,
            userId: input.userId,
            requestId: context?.requestId ?? null,
          },
        ),
      ),
    );
  }

  async query(input: QueryAuditLogsInput = {}): Promise<readonly AuditLog[]> {
    const context = this.requestContext.requireOrganization();
    const organizationId = input.organizationId ?? context.organizationId;
    if (organizationId !== context.organizationId) {
      throw new ForbiddenException('Cross-organization audit access denied.');
    }
    if (
      context.workspaceId &&
      input.workspaceId !== undefined &&
      input.workspaceId !== context.workspaceId
    ) {
      throw new ForbiddenException('Cross-workspace audit access denied.');
    }

    const query: AuditLogQuery = {
      organizationId,
      workspaceId:
        input.workspaceId === undefined
          ? context.workspaceId
          : input.workspaceId,
      limit: Math.min(Math.max(input.limit ?? 50, 1), 100),
    };
    return this.repository.query(query);
  }

  private toRecord(
    input: RecordAuditLogInput,
    context: {
      readonly organizationId: string;
      readonly workspaceId: string | null;
      readonly userId: string | null;
      readonly requestId: string | null;
    },
  ): NewAuditLog {
    const action = input.action.trim();
    const resourceType = input.resourceType.trim();
    if (!action || !resourceType) {
      throw new Error('Audit action and resource type are required.');
    }
    if (action.length > 150 || resourceType.length > 150) {
      throw new Error('Audit action or resource type exceeds its limit.');
    }
    if (input.resourceId && input.resourceId.length > 255) {
      throw new Error('Audit resource ID exceeds its limit.');
    }

    return {
      organizationId: context.organizationId,
      workspaceId: explicitOrContext(input.workspaceId, context.workspaceId),
      userId: explicitOrContext(input.userId, context.userId),
      action,
      resourceType,
      resourceId: input.resourceId ?? null,
      requestId: explicitOrContext(input.requestId, context.requestId),
      metadata: sanitizeAuditMetadata(input.metadata),
      createdAt: input.createdAt ?? new Date(),
    };
  }
}
