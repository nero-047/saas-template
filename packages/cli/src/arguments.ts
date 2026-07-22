export type CliCommand = 'doctor' | 'help' | 'info';

export interface ParsedCliArguments {
  readonly command: CliCommand;
}

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliUsageError';
  }
}

export function parseCliArguments(argv: readonly string[]): ParsedCliArguments {
  const [command, ...positionals] = argv;
  if (
    command === undefined ||
    command === 'help' ||
    command === '--help' ||
    command === '-h'
  ) {
    return { command: 'help' };
  }
  if (command !== 'info' && command !== 'doctor') {
    throw new CliUsageError(`Unknown command: ${command}`);
  }
  if (positionals.length > 0) {
    throw new CliUsageError(`${command} does not accept positional arguments.`);
  }
  return { command };
}
