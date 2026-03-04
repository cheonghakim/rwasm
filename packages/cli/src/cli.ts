import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { buildCommand } from './commands/build.js';
import { devCommand } from './commands/dev.js';

const program = new Command();

program
  .name('rwasm')
  .description('Simplify Rust WebAssembly in JavaScript/TypeScript projects')
  .version('0.1.0');

program
  .command('init')
  .description('Scaffold a Rust WASM crate inside your JS/TS project')
  .option('-n, --name <name>', 'Crate name', 'wasm-lib')
  .option('-d, --dir <path>', 'Directory for the Rust crate', './rust')
  .option('--no-config', 'Skip generating rwasm.config.ts')
  .action(initCommand);

program
  .command('build')
  .description('Build Rust crate to WebAssembly')
  .option('--release', 'Build in release mode (default)')
  .option('--dev', 'Build in dev mode (faster, no optimizations)')
  .option('--target <target>', 'wasm-pack target (web, bundler, nodejs)', 'web')
  .option('--out-dir <path>', 'Output directory for build artifacts')
  .option('--crate <path>', 'Path to Rust crate')
  .action(buildCommand);

program
  .command('dev')
  .description('Watch Rust crate and auto-rebuild on changes')
  .option('--crate <path>', 'Path to Rust crate')
  .option('--debounce <ms>', 'Debounce interval in milliseconds', '300')
  .action(devCommand);

program.parse();
