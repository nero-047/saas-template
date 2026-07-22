import { Test } from '@nestjs/testing';

import { AppModule } from './app.module';
import { RequestContextService } from '../common/context/request-context.service';
import { TenantContextService } from '../common/context/tenant-context.service';
import { AuthService } from '../modules/auth/auth.service';
import { DatabaseService } from '../modules/database/database.service';
import { OrganizationsService } from '../modules/organizations/organizations.service';
import { PermissionsService } from '../modules/permissions/permissions.service';
import { UsersService } from '../modules/users/users.service';
import { WorkspacesService } from '../modules/workspaces/workspaces.service';

describe('AppModule identity foundation', () => {
  it('initializes identity modules without opening a database connection', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    expect(app.get(DatabaseService)).toBeDefined();
    expect(app.get(AuthService)).toBeDefined();
    expect(app.get(UsersService)).toBeDefined();
    expect(app.get(OrganizationsService)).toBeDefined();
    expect(app.get(WorkspacesService)).toBeDefined();
    expect(app.get(PermissionsService)).toBeDefined();
    expect(app.get(RequestContextService)).toBeDefined();
    expect(app.get(TenantContextService)).toBeDefined();

    await app.close();
  });
});
