import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CurrentUser } from '../auth/current-user';
import type { OrganizationContext } from './organization-context';
import { MembershipsRepository } from './memberships.repository';
import { OrganizationsRepository } from './organizations.repository';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizations: OrganizationsRepository,
    private readonly memberships: MembershipsRepository,
  ) {}

  async resolveContext(
    currentUser: CurrentUser,
    organizationId: string,
  ): Promise<OrganizationContext> {
    const membership = await this.memberships.findOrganizationAccessMembership(
      currentUser.id,
      organizationId,
    );

    if (!membership) {
      throw new ForbiddenException('Organization access is not permitted.');
    }

    const organization = await this.organizations.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organization was not found.');
    }

    return { currentUser, organization, membership };
  }
}
