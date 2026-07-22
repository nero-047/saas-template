export interface PermissionDefinition {
  readonly key: string;
  readonly description: string;
}

export const platformPermissions = [
  { key: 'organization.read', description: 'Read organization details.' },
  { key: 'organization.update', description: 'Update organization details.' },
  {
    key: 'organization.manage',
    description: 'Manage ownership-sensitive organization settings.',
  },
  { key: 'workspace.read', description: 'Read workspaces.' },
  { key: 'workspace.create', description: 'Create workspaces.' },
  { key: 'workspace.update', description: 'Update workspaces.' },
  { key: 'workspace.delete', description: 'Delete workspaces.' },
  { key: 'workspace.manage', description: 'Manage workspace settings.' },
  { key: 'users.read', description: 'Read organization members.' },
  { key: 'users.invite', description: 'Invite organization members.' },
  { key: 'users.remove', description: 'Remove organization members.' },
  { key: 'roles.read', description: 'Read organization roles.' },
  { key: 'roles.manage', description: 'Manage organization roles.' },
  {
    key: 'permissions.read',
    description: 'Read the permission catalogue and grants.',
  },
  {
    key: 'permissions.manage',
    description: 'Manage permission grants.',
  },
  { key: 'sessions.read', description: 'Read organization sessions.' },
  { key: 'sessions.revoke', description: 'Revoke organization sessions.' },
] as const satisfies readonly PermissionDefinition[];

export type PlatformPermissionKey = (typeof platformPermissions)[number]['key'];

export interface DefaultRoleDefinition {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly PlatformPermissionKey[];
}

const allPlatformPermissionKeys = platformPermissions.map(({ key }) => key);

export const defaultRoles = [
  {
    key: 'owner',
    name: 'Owner',
    description: 'Organization owner with every platform permission.',
    permissions: allPlatformPermissionKeys,
  },
  {
    key: 'admin',
    name: 'Admin',
    description:
      'Organization administrator without ownership-sensitive management.',
    permissions: [
      'organization.read',
      'organization.update',
      'workspace.read',
      'workspace.create',
      'workspace.update',
      'workspace.delete',
      'workspace.manage',
      'users.read',
      'users.invite',
      'users.remove',
      'roles.read',
      'roles.manage',
      'permissions.read',
      'permissions.manage',
      'sessions.read',
      'sessions.revoke',
    ],
  },
  {
    key: 'member',
    name: 'Member',
    description: 'Organization member with basic read access.',
    permissions: [
      'organization.read',
      'workspace.read',
      'users.read',
      'roles.read',
      'permissions.read',
    ],
  },
] as const satisfies readonly DefaultRoleDefinition[];

export type DefaultRoleKey = (typeof defaultRoles)[number]['key'];
