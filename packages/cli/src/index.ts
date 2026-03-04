// Public API — exported for programmatic usage and plugins
export { defineConfig } from './config/schema.js';
export type { RwasmConfig, BuildOutput } from './config/schema.js';
export { loadConfig } from './config/loader.js';
export { ensureWasmPack } from './wasm-pack/installer.js';
export { runWasmPack } from './wasm-pack/runner.js';
export type { WasmPackOptions } from './wasm-pack/runner.js';
export { generateWrapper } from './codegen/wrapper-gen.js';
