import { Injectable } from '@nestjs/common';
import {
  and,
  auditLogs,
  desc,
  eq,
  isNull,
  memberships,
  type NewAuditLog,
} from '@saas-template/db';

import { DatabaseService } from '../database/database.service';

export interface AuditLogQuery {
  readonly organizationId: string;
  readonly workspaceId?: string | null;
  readonly limit: number;
}

@Injectable()
export class AuditLogRepository {
  constructor(private readonly database: DatabaseService) {}

  async insert(records: readonly NewAuditLog[]) {
    if (records.length === 0) {
      return [];
    }
    return this.database.db
      .insert(auditLogs)
      .values([...records])
      .returning();
  }

  async findOrganizationIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.database.db
      .selectDistinct({ organizationId: memberships.organizationId })
      .from(memberships)
      .where(eq(memberships.userId, userId));
    return rows.map(({ organizationId }) => organizationId);
  }

  query(input: AuditLogQuery) {
    const predicates = [eq(auditLogs.organizationId, input.organizationId)];
    if (input.workspaceId === null) {
      predicates.push(isNull(auditLogs.workspaceId));
    } else if (input.workspaceId !== undefined) {
      predicates.push(eq(auditLogs.workspaceId, input.workspaceId));
    }

    return this.database.db
      .select()
      .from(auditLogs)
      .where(and(...predicates))
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(input.limit);
  }
}
