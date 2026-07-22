import { relations } from 'drizzle-orm';

import { auditLogs } from './audit-logs.js';
import { memberships } from './memberships.js';
import { organizations } from './organizations.js';
import { permissions, rolePermissions } from './permissions.js';
import { membershipRoles, roles } from './roles.js';
import { sessions } from './sessions.js';
import { users } from './users.js';
import { workspaces } from './workspaces.js';

export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLogs),
  memberships: many(memberships),
  sessions: many(sessions),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  auditLogs: many(auditLogs),
  workspaces: many(workspaces),
  memberships: many(memberships),
  roles: many(roles),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  auditLogs: many(auditLogs),
  organization: one(organizations, {
    fields: [workspaces.organizationId],
    references: [organizations.id],
  }),
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one, many }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [memberships.workspaceId],
    references: [workspaces.id],
  }),
  membershipRoles: many(membershipRoles),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  membershipRoles: many(membershipRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const membershipRolesRelations = relations(
  membershipRoles,
  ({ one }) => ({
    membership: one(memberships, {
      fields: [membershipRoles.membershipId],
      references: [memberships.id],
    }),
    role: one(roles, {
      fields: [membershipRoles.roleId],
      references: [roles.id],
    }),
  }),
);

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [auditLogs.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
