import { Injectable, NotFoundException } from '@nestjs/common';
import type { CurrentUserResponse } from '@saas-template/validation';

import type { CurrentUser } from '../auth/current-user';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async getCurrent(currentUser: CurrentUser): Promise<CurrentUserResponse> {
    const user = await this.users.findById(currentUser.id);

    if (!user) {
      throw new NotFoundException('Current user was not found.');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
