import { Test } from '@nestjs/testing';

import { AppModule } from './app.module';
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

    expect(module.get(DatabaseService)).toBeDefined();
    expect(module.get(AuthService)).toBeDefined();
    expect(module.get(UsersService)).toBeDefined();
    expect(module.get(OrganizationsService)).toBeDefined();
    expect(module.get(WorkspacesService)).toBeDefined();
    expect(module.get(PermissionsService)).toBeDefined();

    await module.close();
  });
});
