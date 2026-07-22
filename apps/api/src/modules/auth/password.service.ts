import { Injectable } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} as const;

// A valid non-secret hash keeps unknown-user login verification timing close to
// known-user verification without performing work during module construction.
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$8+USVdGHZ6/UOv3+bs08SQ$maM3JtlIVOYj4fG+HRi4Q65sNPjcGfbXoEHKAlYxgyo';

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  }

  async matches(password: string, passwordHash?: string): Promise<boolean> {
    const candidateHash = passwordHash ?? DUMMY_PASSWORD_HASH;

    try {
      const matches = await verify(candidateHash, password);
      return passwordHash !== undefined && matches;
    } catch {
      return false;
    }
  }
}
