import { resolve } from 'node:path';
import { log } from '../logger.js';
import { loadConfig } from '../config/loader.js';
import { ensureWasmPack } from '../wasm-pack/installer.js';
import { runWasmPack } from '../wasm-pack/runner.js';
import { generateWrapper } from '../codegen/wrapper-gen.js';

interface BuildCommandOptions {
  release?: boolean;
  dev?: boolean;
  target?: string;
  outDir?: string;
  crate?: string;
}

export async function buildCommand(options: BuildCommandOptions): Promise<void> {
  const config = await loadConfig();
  const cratePath = resolve(options.crate ?? config.crate);
  const outDir = resolve(options.outDir ?? config.outDir ?? resolve(cratePath, 'pkg'));
  const target = (options.target ?? config.target ?? 'web') as 'web' | 'bundler' | 'nodejs' | 'no-modules';
  const profile = options.dev ? 'dev' : (config.profile ?? 'release');

  log.info(`Building ${cratePath} → ${outDir}`);

  // Ensure wasm-pack is available
  const wasmPackBin = await ensureWasmPack();

  const start = performance.now();

  // Run wasm-pack
  await runWasmPack({
    bin: wasmPackBin,
    cratePath,
    target,
    profile,
    outDir,
    cargoArgs: config.cargoArgs,
    wasmOpt: config.wasmOpt,
  });

  // Generate TypeScript wrapper
  await generateWrapper(outDir);

  const duration = Math.round(performance.now() - start);

  // Run afterBuild hook
  if (config.afterBuild) {
    const wasmFile = ''; // Will be found by the wrapper gen
    await config.afterBuild({
      outDir,
      wasmFile,
      duration,
      release: profile === 'release',
    });
  }

  log.success(`Build completed in ${duration}ms`);
}
