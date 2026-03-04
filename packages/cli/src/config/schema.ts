/** Build output metadata passed to afterBuild hook */
export interface BuildOutput {
  /** Path to the output directory */
  outDir: string;
  /** Path to the generated .wasm file */
  wasmFile: string;
  /** Build duration in milliseconds */
  duration: number;
  /** Whether it was a release build */
  release: boolean;
}

/** rwasm.config.ts schema */
export interface RwasmConfig {
  /** Path to the Rust crate directory (relative to project root) */
  crate: string;

  /** wasm-pack build target. Default: 'web' */
  target?: 'web' | 'bundler' | 'nodejs' | 'no-modules';

  /** Output directory for WASM build artifacts. Default: '<crate>/pkg' */
  outDir?: string;

  /** Build profile. Default: 'release' */
  profile?: 'dev' | 'release' | 'profiling';

  /** Extra arguments passed to cargo */
  cargoArgs?: string[];

  /** wasm-opt level. false to disable. Default: '-O2' */
  wasmOpt?: string | false;

  /** Hook: runs after build completes */
  afterBuild?: (output: BuildOutput) => void | Promise<void>;

  /** Watch mode configuration */
  watch?: {
    /** Directories to watch (relative to crate). Default: ['src'] */
    include?: string[];
    /** Glob patterns to ignore */
    ignore?: string[];
    /** Debounce interval in ms. Default: 300 */
    debounce?: number;
  };
}

/** Helper for type-safe config files */
export function defineConfig(config: RwasmConfig): RwasmConfig {
  return config;
}
