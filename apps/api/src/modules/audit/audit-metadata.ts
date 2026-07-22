import type { AuditMetadata } from '@saas-template/db';

const SENSITIVE_KEY =
  /password|token|cookie|secret|authorization|api[-_]?key|credential/i;
const MAX_DEPTH = 5;
const MAX_ENTRIES = 50;
const MAX_STRING_LENGTH = 2_000;

function sanitizeValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (depth > MAX_DEPTH || value === undefined) {
    return undefined;
  }
  if (value === null || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    return value.slice(0, MAX_STRING_LENGTH);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value !== 'object' || seen.has(value)) {
    return undefined;
  }

  seen.add(value);
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ENTRIES)
      .map((item) => sanitizeValue(item, depth + 1, seen))
      .filter((item) => item !== undefined);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value).slice(0, MAX_ENTRIES)) {
    if (SENSITIVE_KEY.test(key)) {
      continue;
    }
    const sanitizedItem = sanitizeValue(item, depth + 1, seen);
    if (sanitizedItem !== undefined) {
      sanitized[key] = sanitizedItem;
    }
  }
  return sanitized;
}

export function sanitizeAuditMetadata(
  metadata: AuditMetadata | null | undefined,
): AuditMetadata | null {
  if (!metadata) {
    return null;
  }
  const sanitized = sanitizeValue(metadata, 0, new WeakSet<object>());
  if (
    typeof sanitized !== 'object' ||
    sanitized === null ||
    Array.isArray(sanitized) ||
    Object.keys(sanitized).length === 0
  ) {
    return null;
  }
  return sanitized as AuditMetadata;
}
