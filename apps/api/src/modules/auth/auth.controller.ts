import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { AuthResponse } from '@saas-template/validation';

import { CurrentUser } from '../../common/context/current-context.decorators';
import { AuthService } from './auth.service';
import type { CurrentUser as AuthenticatedUser } from './current-user';
import {
  type CookieResponse,
  SessionCookieService,
} from './session-cookie.service';
import { SessionGuard } from './session.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: SessionCookieService,
  ) {}

  @Post('register')
  async register(
    @Body() input: unknown,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<AuthResponse> {
    const authentication = await this.auth.register(input);
    this.cookies.set(response, authentication.token, authentication.expiresAt);
    return authentication.response;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() input: unknown,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<AuthResponse> {
    const authentication = await this.auth.login(input);
    this.cookies.set(response, authentication.token, authentication.expiresAt);
    return authentication.response;
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<void> {
    await this.auth.logout(currentUser);
    this.cookies.clear(response);
  }
}
