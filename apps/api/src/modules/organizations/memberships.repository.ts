import { Injectable } from '@nestjs/common';
import { and, eq, isNull, memberships } from '@saas-template/db';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class MembershipsRepository {
  constructor(private readonly database: DatabaseService) {}

  findOrganizationMembership(userId: string, organizationId: string) {
    return this.findOne(userId, organizationId, null);
  }

  async findOrganizationAccessMembership(
    userId: string,
    organizationId: string,
  ) {
    return (
      (await this.findOrganizationMembership(userId, organizationId)) ??
      this.findAnyWorkspaceMembership(userId, organizationId)
    );
  }

  async findWorkspaceMembership(
    userId: string,
    organizationId: string,
    workspaceId: string,
  ) {
    return (
      (await this.findOne(userId, organizationId, workspaceId)) ??
      this.findOrganizationMembership(userId, organizationId)
    );
  }

  private async findOne(
    userId: string,
    organizationId: string,
    workspaceId: string | null,
  ) {
    const workspacePredicate = workspaceId
      ? eq(memberships.workspaceId, workspaceId)
      : isNull(memberships.workspaceId);
    const [membership] = await this.database.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.organizationId, organizationId),
          workspacePredicate,
        ),
      )
      .limit(1);

    return membership;
  }

  private async findAnyWorkspaceMembership(
    userId: string,
    organizationId: string,
  ) {
    const [membership] = await this.database.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.organizationId, organizationId),
        ),
      )
      .limit(1);

    return membership;
  }
}
