import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AuthRuntimeConfigService } from './auth-runtime-config.service';

export interface NewSessionCredential {
  readonly token: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

@Injectable()
export class SessionTokenService {
  constructor(private readonly config: AuthRuntimeConfigService) {}

  create(now: Date = new Date()): NewSessionCredential {
    const token = randomBytes(32).toString('base64url');
    return {
      token,
      tokenHash: this.hash(token),
      expiresAt: new Date(
        now.getTime() + this.config.session.ttlSeconds * 1000,
      ),
    };
  }

  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('base64url');
  }
}
