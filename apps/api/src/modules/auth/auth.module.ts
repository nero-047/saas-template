import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthRuntimeConfigService } from './auth-runtime-config.service';
import { AuthService } from './auth.service';
import { IdentityRepository } from './identity.repository';
import { PasswordService } from './password.service';
import { SessionCookieService } from './session-cookie.service';
import { SessionGuard } from './session.guard';
import { SessionTokenService } from './session-token.service';
import { SessionsRepository } from './sessions.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthRuntimeConfigService,
    AuthService,
    IdentityRepository,
    PasswordService,
    SessionCookieService,
    SessionGuard,
    SessionTokenService,
    SessionsRepository,
  ],
  exports: [AuthService, SessionCookieService, SessionGuard],
})
export class AuthModule {}
