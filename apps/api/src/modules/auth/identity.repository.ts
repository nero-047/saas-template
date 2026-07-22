import { Injectable } from '@nestjs/common';
import {
  eq,
  membershipRoles,
  memberships,
  organizations,
  seedOrganizationRbac,
  sessions,
  users,
} from '@saas-template/db';

import { DatabaseService } from '../database/database.service';

export interface RegistrationRecord {
  readonly email: string;
  readonly normalizedEmail: string;
  readonly displayName: string;
  readonly passwordHash: string;
  readonly organizationName: string;
  readonly organizationSlug: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly now: Date;
}

export class DuplicateEmailError extends Error {}

function isNormalizedEmailConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as {
    readonly code?: unknown;
    readonly constraint_name?: unknown;
    readonly constraint?: unknown;
  };
  return (
    candidate.code === '23505' &&
    (candidate.constraint_name === 'users_normalized_email_unique' ||
      candidate.constraint === 'users_normalized_email_unique')
  );
}

@Injectable()
export class IdentityRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByNormalizedEmail(normalizedEmail: string) {
    const [user] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.normalizedEmail, normalizedEmail))
      .limit(1);
    return user;
  }

  async register(input: RegistrationRecord) {
    try {
      return await this.database.db.transaction(async (transaction) => {
        const [user] = await transaction
          .insert(users)
          .values({
            email: input.email,
            normalizedEmail: input.normalizedEmail,
            displayName: input.displayName,
            passwordHash: input.passwordHash,
            passwordUpdatedAt: input.now,
            createdAt: input.now,
            updatedAt: input.now,
          })
          .returning();
        if (!user) {
          throw new Error('User insertion did not return a row.');
        }

        const [organization] = await transaction
          .insert(organizations)
          .values({
            name: input.organizationName,
            slug: input.organizationSlug,
            createdAt: input.now,
            updatedAt: input.now,
          })
          .returning();
        if (!organization) {
          throw new Error('Organization insertion did not return a row.');
        }

        const [membership] = await transaction
          .insert(memberships)
          .values({
            userId: user.id,
            organizationId: organization.id,
            createdAt: input.now,
            updatedAt: input.now,
          })
          .returning();
        if (!membership) {
          throw new Error('Membership insertion did not return a row.');
        }

        const { roles: seededRoles } = await seedOrganizationRbac(
          transaction,
          organization.id,
          input.now,
        );
        const ownerRole = seededRoles.owner;

        await transaction.insert(membershipRoles).values({
          membershipId: membership.id,
          roleId: ownerRole.id,
          organizationId: organization.id,
          createdAt: input.now,
        });

        const [session] = await transaction
          .insert(sessions)
          .values({
            userId: user.id,
            tokenHash: input.tokenHash,
            expiresAt: input.expiresAt,
            lastUsedAt: input.now,
            createdAt: input.now,
            updatedAt: input.now,
          })
          .returning();
        if (!session) {
          throw new Error('Session insertion did not return a row.');
        }

        return { user, organization, membership, ownerRole, session };
      });
    } catch (error) {
      if (isNormalizedEmailConflict(error)) {
        throw new DuplicateEmailError('The email is already registered.');
      }
      throw error;
    }
  }
}
