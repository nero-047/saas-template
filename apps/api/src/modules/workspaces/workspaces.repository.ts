import { Injectable } from '@nestjs/common';
import { and, eq, workspaces } from '@saas-template/db';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(organizationId: string, workspaceId: string) {
    const [workspace] = await this.database.db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.id, workspaceId),
          eq(workspaces.organizationId, organizationId),
        ),
      )
      .limit(1);

    return workspace;
  }
}
