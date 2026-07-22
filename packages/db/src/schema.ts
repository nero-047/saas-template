import * as auditLogsSchema from './schema/audit-logs.js';
import * as membershipsSchema from './schema/memberships.js';
import * as organizationsSchema from './schema/organizations.js';
import * as permissionsSchema from './schema/permissions.js';
import * as relationsSchema from './schema/relations.js';
import * as rolesSchema from './schema/roles.js';
import * as sessionsSchema from './schema/sessions.js';
import * as usersSchema from './schema/users.js';
import * as workspacesSchema from './schema/workspaces.js';

export * from './schema/audit-logs.js';
export * from './schema/memberships.js';
export * from './schema/organizations.js';
export * from './schema/permissions.js';
export * from './schema/relations.js';
export * from './schema/roles.js';
export * from './schema/sessions.js';
export * from './schema/users.js';
export * from './schema/workspaces.js';

export const schema = {
  ...auditLogsSchema,
  ...membershipsSchema,
  ...organizationsSchema,
  ...permissionsSchema,
  ...relationsSchema,
  ...rolesSchema,
  ...sessionsSchema,
  ...usersSchema,
  ...workspacesSchema,
};
