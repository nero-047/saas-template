import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { NERO_CONFIG_FILE } from './config-loader.js';

export type DoctorStatus = 'pass' | 'fail';

export interface DoctorCheck {
  readonly detail: string;
  readonly name: string;
  readonly status: DoctorStatus;
}

export interface CommandResult {
  readonly output: string;
  readonly status: number | null;
}

export interface DoctorEnvironment {
  readonly fileExists: (path: string) => boolean;
  readonly nodeVersion: string;
  readonly readTextFile: (path: string) => string;
  readonly runCommand: (
    command: string,
    args: readonly string[],
    cwd: string,
  ) => CommandResult;
}

const REQUIRED_FILES = [
  'package.json',
  'pnpm-workspace.yaml',
  'nx.json',
  '.node-version',
] as const;

const defaultEnvironment: DoctorEnvironment = {
  fileExists: existsSync,
  nodeVersion: process.versions.node,
  readTextFile: (path) => readFileSync(path, 'utf8'),
  runCommand: (command, args, cwd) => {
    const result = spawnSync(command, [...args], {
      cwd,
      encoding: 'utf8',
      shell: false,
    });
    return {
      output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
      status: result.status,
    };
  },
};

function pass(name: string, detail: string): DoctorCheck {
  return { name, detail, status: 'pass' };
}

function fail(name: string, detail: string): DoctorCheck {
  return { name, detail, status: 'fail' };
}

function safelyRead(
  environment: DoctorEnvironment,
  path: string,
): string | undefined {
  try {
    return environment.readTextFile(path).trim();
  } catch {
    return undefined;
  }
}

export function runDoctorChecks(
  cwd: string,
  overrides: Partial<DoctorEnvironment> = {},
): readonly DoctorCheck[] {
  const environment = { ...defaultEnvironment, ...overrides };
  const nodeRequirement = safelyRead(
    environment,
    resolve(cwd, '.node-version'),
  );
  const nodeMajor = environment.nodeVersion.split('.')[0];
  const nodeCheck =
    nodeRequirement !== undefined && nodeMajor === nodeRequirement
      ? pass('Node.js', `${environment.nodeVersion} matches ${nodeRequirement}`)
      : fail(
          'Node.js',
          nodeRequirement === undefined
            ? 'Unable to read .node-version.'
            : `Expected major ${nodeRequirement}; found ${environment.nodeVersion}.`,
        );

  const packageSource = safelyRead(environment, resolve(cwd, 'package.json'));
  let packageManager: string | undefined;
  try {
    packageManager = packageSource
      ? ((JSON.parse(packageSource) as { packageManager?: unknown })
          .packageManager as string | undefined)
      : undefined;
  } catch {
    packageManager = undefined;
  }
  const expectedPnpm = packageManager?.startsWith('pnpm@')
    ? packageManager.slice('pnpm@'.length)
    : undefined;
  const pnpmResult = environment.runCommand('pnpm', ['--version'], cwd);
  const pnpmCheck =
    expectedPnpm !== undefined &&
    pnpmResult.status === 0 &&
    pnpmResult.output === expectedPnpm
      ? pass('pnpm', `${pnpmResult.output} matches packageManager`)
      : fail(
          'pnpm',
          expectedPnpm === undefined
            ? 'package.json does not declare pnpm.'
            : `Expected ${expectedPnpm}; found ${pnpmResult.output || 'unavailable'}.`,
        );

  const nxResult = environment.runCommand(
    'pnpm',
    ['exec', 'nx', '--version'],
    cwd,
  );
  const nxCheck =
    nxResult.status === 0
      ? pass('Nx', nxResult.output.replace(/\s+/g, ' ') || 'available')
      : fail('Nx', nxResult.output || 'Nx is unavailable.');

  const configCheck = environment.fileExists(resolve(cwd, NERO_CONFIG_FILE))
    ? pass('Configuration', NERO_CONFIG_FILE)
    : fail('Configuration', `${NERO_CONFIG_FILE} is missing.`);

  const missingFiles = REQUIRED_FILES.filter(
    (file) => !environment.fileExists(resolve(cwd, file)),
  );
  const filesCheck =
    missingFiles.length === 0
      ? pass('Required files', 'All required workspace files are present.')
      : fail('Required files', `Missing: ${missingFiles.join(', ')}`);

  const syncResult = environment.runCommand(
    'pnpm',
    ['nx', 'sync:check', '--outputStyle=static'],
    cwd,
  );
  const syncCheck =
    syncResult.status === 0
      ? pass('Workspace consistency', 'Nx synchronization check passed.')
      : fail(
          'Workspace consistency',
          syncResult.output || 'Nx synchronization check failed.',
        );

  return [nodeCheck, pnpmCheck, nxCheck, configCheck, filesCheck, syncCheck];
}

export function formatDoctorReport(checks: readonly DoctorCheck[]): string {
  return [
    'Nero Doctor',
    '',
    ...checks.map(
      (check) =>
        `${check.status === 'pass' ? '✓' : '✗'} ${check.name}: ${check.detail}`,
    ),
  ].join('\n');
}
