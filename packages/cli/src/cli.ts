import type { NeroProjectConfig } from '@saas-template/config';

import { CliUsageError, parseCliArguments } from './arguments.js';
import {
  ConfigFileLoadError,
  ConfigFileNotFoundError,
  loadNeroConfig,
} from './config-loader.js';
import {
  formatDoctorReport,
  runDoctorChecks,
  type DoctorCheck,
} from './doctor.js';
import { formatHelp, formatProjectInfo } from './output.js';

export interface CliOptions {
  readonly cwd?: string;
  readonly loadConfig?: (cwd: string) => Promise<NeroProjectConfig>;
  readonly runDoctor?: (cwd: string) => readonly DoctorCheck[];
  readonly stderr?: (text: string) => void;
  readonly stdout?: (text: string) => void;
}

export async function runCli(
  argv: readonly string[],
  options: CliOptions = {},
): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const stdout =
    options.stdout ?? ((text) => process.stdout.write(`${text}\n`));
  const stderr =
    options.stderr ?? ((text) => process.stderr.write(`${text}\n`));

  try {
    const { command } = parseCliArguments(argv);
    if (command === 'help') {
      stdout(formatHelp());
      return 0;
    }
    if (command === 'info') {
      const config = await (options.loadConfig ?? loadNeroConfig)(cwd);
      stdout(formatProjectInfo(config));
      return 0;
    }

    const checks = (options.runDoctor ?? runDoctorChecks)(cwd);
    stdout(formatDoctorReport(checks));
    return checks.every((check) => check.status === 'pass') ? 0 : 1;
  } catch (error) {
    if (
      error instanceof CliUsageError ||
      error instanceof ConfigFileNotFoundError ||
      error instanceof ConfigFileLoadError ||
      error instanceof Error
    ) {
      stderr(error.message);
    } else {
      stderr('Unable to run the Nero CLI.');
    }
    return 1;
  }
}
