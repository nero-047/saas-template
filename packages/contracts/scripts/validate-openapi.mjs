import { readFile } from 'node:fs/promises';

import { parse } from 'yaml';

const source = await readFile('openapi/openapi.yaml', 'utf8');
const document = parse(source);

if (
  document === null ||
  typeof document !== 'object' ||
  Array.isArray(document)
) {
  throw new Error('The OpenAPI document must be an object.');
}

if (document.openapi !== '3.1.1') {
  throw new Error('The OpenAPI document must declare version 3.1.1.');
}

if (
  document.info === null ||
  typeof document.info !== 'object' ||
  typeof document.info.title !== 'string' ||
  typeof document.info.version !== 'string'
) {
  throw new Error(
    'The OpenAPI document must contain string info.title and info.version fields.',
  );
}

if (
  document.paths === null ||
  typeof document.paths !== 'object' ||
  Array.isArray(document.paths)
) {
  throw new Error('The OpenAPI paths field must be an object.');
}

if (
  document.components === null ||
  typeof document.components !== 'object' ||
  document.components.schemas === null ||
  typeof document.components.schemas !== 'object' ||
  Array.isArray(document.components.schemas)
) {
  throw new Error('The OpenAPI components.schemas field must be an object.');
}

const requiredOperations = {
  '/auth/register': 'post',
  '/auth/login': 'post',
  '/auth/logout': 'post',
  '/users/me': 'get',
  '/organizations/current': 'get',
  '/workspaces/current': 'get',
};

for (const [path, method] of Object.entries(requiredOperations)) {
  if (document.paths[path]?.[method] === undefined) {
    throw new Error(
      `The OpenAPI document is missing ${method.toUpperCase()} ${path}.`,
    );
  }
}

const requiredSchemas = [
  'RegisterRequest',
  'LoginRequest',
  'AuthResponse',
  'CurrentUserResponse',
  'User',
  'Organization',
  'Workspace',
  'Membership',
  'Role',
  'Permission',
  'Session',
  'ErrorResponse',
  'PaginationMeta',
];

for (const schemaName of requiredSchemas) {
  if (document.components.schemas[schemaName] === undefined) {
    throw new Error(
      `The OpenAPI document is missing the ${schemaName} schema.`,
    );
  }
}

if (document.servers?.[0]?.url !== '/api/v1') {
  throw new Error(
    'The OpenAPI document must use /api/v1 as its first server base path.',
  );
}

if (document.components.parameters?.RequestId?.schema?.format !== 'uuid') {
  throw new Error('X-Request-Id must be documented as a UUID header.');
}

const errorResponse = document.components.schemas.ErrorResponse;
if (
  !errorResponse.required?.includes('error') ||
  !errorResponse.required?.includes('requestId') ||
  errorResponse.properties?.error?.properties?.requestId !== undefined ||
  errorResponse.properties?.requestId?.format !== 'uuid'
) {
  throw new Error(
    'ErrorResponse must contain top-level error and UUID requestId fields.',
  );
}

console.log('OpenAPI contract structure is valid.');
