import { Injectable } from '@nestjs/common';
import { eq, organizations } from '@saas-template/db';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(organizationId: string) {
    const [organization] = await this.database.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    return organization;
  }
}
