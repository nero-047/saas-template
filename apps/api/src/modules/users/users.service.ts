import { Injectable, NotFoundException } from '@nestjs/common';

import type { CurrentUser } from '../auth/current-user';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async getCurrent(currentUser: CurrentUser) {
    const user = await this.users.findById(currentUser.id);

    if (!user) {
      throw new NotFoundException('Current user was not found.');
    }

    return user;
  }
}
