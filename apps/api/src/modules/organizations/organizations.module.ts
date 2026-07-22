import { Module } from '@nestjs/common';

import { MembershipsRepository } from './memberships.repository';
import { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';

@Module({
  providers: [
    MembershipsRepository,
    OrganizationsRepository,
    OrganizationsService,
  ],
  exports: [MembershipsRepository, OrganizationsService],
})
export class OrganizationsModule {}
