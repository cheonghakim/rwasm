import { spawn } from 'node:child_process';
import { log } from '../logger.js';

export interface WasmPackOptions {
  /** Path to wasm-pack binary */
  bin: string;
  /** Path to the Rust crate */
  cratePath: string;
  /** Build target */
  target: 'web' | 'bundler' | 'nodejs' | 'no-modules';
  /** Build profile */
  profile: 'dev' | 'release' | 'profiling';
  /** Output directory */
  outDir: string;
  /** Extra cargo arguments */
  cargoArgs?: string[];
  /** wasm-opt level (false to disable) */
  wasmOpt?: string | false;
}

/** Run wasm-pack build and return when complete */
export function runWasmPack(options: WasmPackOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      'build',
      options.cratePath,
      '--target', options.target,
      '--out-dir', options.outDir,
    ];

    if (options.profile === 'dev') {
      args.push('--dev');
    } else if (options.profile === 'profiling') {
      args.push('--profiling');
    }
    // 'release' is the default — no flag needed

    if (options.wasmOpt === false) {
      args.push('--no-opt');
    }

    if (options.cargoArgs?.length) {
      args.push('--', ...options.cargoArgs);
    }

    log.step(`wasm-pack ${args.join(' ')}`);

    const child = spawn(options.bin, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`wasm-pack exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to run wasm-pack: ${err.message}`));
    });
  });
}
