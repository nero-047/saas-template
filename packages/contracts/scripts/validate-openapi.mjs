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

console.log('OpenAPI contract structure is valid.');
