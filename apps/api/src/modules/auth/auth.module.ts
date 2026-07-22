import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { SessionsRepository } from './sessions.repository';

@Module({
  providers: [AuthService, SessionsRepository],
  exports: [AuthService],
})
export class AuthModule {}
