import { Controller, Get, UseGuards } from '@nestjs/common';
import type { CurrentUserResponse } from '@saas-template/validation';

import type { CurrentUser } from '../auth/current-user';
import { RequestUser } from '../auth/request-user.decorator';
import { SessionGuard } from '../auth/session.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @UseGuards(SessionGuard)
  getCurrent(
    @RequestUser() currentUser: CurrentUser,
  ): Promise<CurrentUserResponse> {
    return this.users.getCurrent(currentUser);
  }
}
