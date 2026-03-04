import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RwasmConfig } from './schema.js';

const CONFIG_FILES = [
  'rwasm.config.ts',
  'rwasm.config.js',
  'rwasm.config.mjs',
];

/** Load rwasm config from the project root */
export async function loadConfig(cwd: string = process.cwd()): Promise<RwasmConfig> {
  for (const file of CONFIG_FILES) {
    const configPath = resolve(cwd, file);
    if (existsSync(configPath)) {
      try {
        const mod = await import(pathToFileURL(configPath).href);
        const config = mod.default ?? mod;
        return validateConfig(config);
      } catch {
        // .ts files need a bundler/loader — try next format
        continue;
      }
    }
  }

  // No config file found — use defaults
  return getDefaultConfig(cwd);
}

function getDefaultConfig(cwd: string): RwasmConfig {
  // Try to auto-detect Rust crate
  const commonPaths = ['rust', 'rust-lib', 'wasm', 'crate', '.'];
  for (const dir of commonPaths) {
    const cargoPath = resolve(cwd, dir, 'Cargo.toml');
    if (existsSync(cargoPath)) {
      return { crate: dir === '.' ? '.' : `./${dir}` };
    }
  }

  return { crate: './rust' };
}

function validateConfig(config: unknown): RwasmConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('rwasm config must export an object');
  }

  const c = config as Record<string, unknown>;
  if (!c.crate || typeof c.crate !== 'string') {
    throw new Error('rwasm config must have a "crate" string property');
  }

  return config as RwasmConfig;
}
