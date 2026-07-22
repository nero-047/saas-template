import { ForbiddenException } from '@nestjs/common';

import { PermissionsRepository } from './permissions.repository';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  const repository = {
    findKeysForMembership: jest.fn<Promise<string[]>, [string]>(),
  };
  const service = new PermissionsService(
    repository as unknown as PermissionsRepository,
  );
  const context = { membershipId: 'membership-id' };

  beforeEach(() => {
    repository.findKeysForMembership.mockReset();
  });

  it('allows an explicitly granted permission', async () => {
    repository.findKeysForMembership.mockResolvedValue([
      'workspace.read',
      'workspace.manage',
    ]);

    await expect(
      service.hasPermission(context, 'workspace.manage'),
    ).resolves.toBe(true);
    expect(repository.findKeysForMembership).toHaveBeenCalledWith(
      'membership-id',
    );
  });

  it('denies a permission that is not explicitly granted', async () => {
    repository.findKeysForMembership.mockResolvedValue(['workspace.read']);

    await expect(
      service.hasPermission(context, 'workspace.manage'),
    ).resolves.toBe(false);
    await expect(
      service.assertPermission(context, 'workspace.manage'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('checks an already-resolved request subject without database access', () => {
    expect(
      service.can(
        { permissions: ['workspace.read', 'workspace.update'] },
        'workspace.update',
      ),
    ).toBe(true);
    expect(
      service.can({ permissions: ['workspace.read'] }, 'workspace.update'),
    ).toBe(false);
    expect(service.can(undefined, 'workspace.read')).toBe(false);
  });

  it('requires every declared permission and denies empty requirements', () => {
    const subject = {
      permissions: ['workspace.read', 'workspace.update'],
    };

    expect(() =>
      service.assertCan(subject, ['workspace.read', 'workspace.update']),
    ).not.toThrow();
    expect(() =>
      service.assertCan(subject, ['workspace.read', 'workspace.delete']),
    ).toThrow(ForbiddenException);
    expect(() => service.assertCan(subject, [])).toThrow(ForbiddenException);
  });
});
