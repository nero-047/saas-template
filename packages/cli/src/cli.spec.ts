import { parseNeroConfig } from '@saas-template/config';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CliUsageError, parseCliArguments } from './arguments.js';
import { runCli } from './cli.js';
import { ConfigFileNotFoundError, loadNeroConfig } from './config-loader.js';
import { runDoctorChecks, type DoctorEnvironment } from './doctor.js';

const projectConfig = parseNeroConfig({
  project: { name: 'my-app' },
  architecture: 'b2b',
  applications: ['api', 'worker', 'web', 'admin'],
  platform: {
    database: { enabled: true },
    queue: { enabled: true },
    contracts: { enabled: true },
  },
  features: ['authentication', 'organizations', 'rbac', 'audit', 'jobs'],
});

describe('Nero CLI', () => {
  it('parses supported commands and rejects unsupported positionals', () => {
    expect(parseCliArguments(['info'])).toEqual({ command: 'info' });
    expect(parseCliArguments(['doctor'])).toEqual({ command: 'doctor' });
    expect(parseCliArguments([])).toEqual({ command: 'help' });
    expect(() => parseCliArguments(['dev'])).toThrow(CliUsageError);
    expect(() => parseCliArguments(['info', 'api'])).toThrow(
      'info does not accept positional arguments.',
    );
  });

  it('prints the validated project configuration', async () => {
    const output: string[] = [];
    const status = await runCli(['info'], {
      cwd: '/workspace',
      loadConfig: async () => projectConfig,
      stdout: (text) => output.push(text),
    });

    expect(status).toBe(0);
    expect(output.join('\n')).toContain('Nero SaaS Platform');
    expect(output.join('\n')).toContain('my-app');
    expect(output.join('\n')).toContain('B2B SaaS');
    expect(output.join('\n')).toContain('✓ API');
    expect(output.join('\n')).toContain('✓ Authentication');
    expect(output.join('\n')).toContain('PostgreSQL');
    expect(output.join('\n')).toContain('BullMQ');
  });

  it('loads a trusted TypeScript configuration from the project root', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nero-cli-config-'));
    try {
      await writeFile(
        join(directory, 'nero.config.ts'),
        `export default {
          project: { name: 'loaded-project' },
          applications: ['api'] as const
        };`,
        'utf8',
      );

      await expect(loadNeroConfig(directory)).resolves.toMatchObject({
        project: { name: 'loaded-project' },
        applications: ['api'],
        architecture: 'blank',
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('reports doctor failures without changing the project', async () => {
    const files = new Set([
      '/workspace/package.json',
      '/workspace/pnpm-workspace.yaml',
      '/workspace/nx.json',
      '/workspace/.node-version',
    ]);
    const environment: DoctorEnvironment = {
      fileExists: (path) => files.has(path),
      nodeVersion: '24.1.0',
      readTextFile: (path) =>
        path.endsWith('.node-version')
          ? '24\n'
          : JSON.stringify({ packageManager: 'pnpm@11.10.0' }),
      runCommand: (_command, args) => {
        if (args[0] === '--version') {
          return { output: '11.10.0', status: 0 };
        }
        if (args.includes('sync:check')) {
          return { output: 'out of sync', status: 1 };
        }
        return { output: '23.1.0', status: 0 };
      },
    };

    const checks = runDoctorChecks('/workspace', environment);
    expect(
      checks.find((check) => check.name === 'Configuration'),
    ).toMatchObject({
      status: 'fail',
    });
    expect(
      checks.find((check) => check.name === 'Workspace consistency'),
    ).toMatchObject({ status: 'fail', detail: 'out of sync' });

    const output: string[] = [];
    await expect(
      runCli(['doctor'], {
        cwd: '/workspace',
        runDoctor: () => checks,
        stdout: (text) => output.push(text),
      }),
    ).resolves.toBe(1);
    expect(output.join('\n')).toContain('✗ Configuration');
  });

  it('returns a safe error when configuration is missing', async () => {
    const errors: string[] = [];
    const status = await runCli(['info'], {
      cwd: '/workspace',
      loadConfig: async () => {
        throw new ConfigFileNotFoundError('/workspace/nero.config.ts');
      },
      stderr: (text) => errors.push(text),
    });

    expect(status).toBe(1);
    expect(errors).toEqual([
      'Nero configuration not found at /workspace/nero.config.ts.',
    ]);
  });
});
