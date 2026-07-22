import { readFile } from 'node:fs/promises';

import { parse } from 'yaml';

const source = await readFile('openapi/openapi.yaml', 'utf8');
const document = parse(source);
const unsupportedKeywords = new Set([
  'allOf',
  'anyOf',
  'callbacks',
  'not',
  'oneOf',
  'webhooks',
]);

function inspect(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspect(item, `${path}[${index}]`));
    return;
  }
  if (value === null || typeof value !== 'object') {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (unsupportedKeywords.has(key)) {
      throw new Error(
        `The future Dart generator foundation does not support ${key} at ${path}.`,
      );
    }
    if (
      key === '$ref' &&
      (typeof child !== 'string' || !child.startsWith('#/components/'))
    ) {
      throw new Error(
        `The future Dart generator foundation requires local component references at ${path}.`,
      );
    }
    if (key === 'type' && Array.isArray(child)) {
      const nonNullTypes = child.filter((item) => item !== 'null');
      if (
        child.length !== 2 ||
        nonNullTypes.length !== 1 ||
        !child.includes('null')
      ) {
        throw new Error(
          `The future Dart generator foundation supports only nullable type unions at ${path}.`,
        );
      }
    }
    inspect(child, `${path}.${key}`);
  }
}

if (document?.openapi !== '3.1.1') {
  throw new Error('Dart compatibility validation requires OpenAPI 3.1.1.');
}

inspect(document);
console.log('OpenAPI contract is within the documented future Dart subset.');
