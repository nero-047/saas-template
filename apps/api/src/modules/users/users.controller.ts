import { Controller, Get, UseGuards } from '@nestjs/common';
import type { CurrentUserResponse } from '@saas-template/validation';

import { CurrentUser } from '../../common/context/current-context.decorators';
import type { CurrentUser as AuthenticatedUser } from '../auth/current-user';
import { SessionGuard } from '../auth/session.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @UseGuards(SessionGuard)
  getCurrent(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<CurrentUserResponse> {
    return this.users.getCurrent(currentUser);
  }
}
