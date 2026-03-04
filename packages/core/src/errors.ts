export class RwasmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RwasmError';
  }
}

export class WasmLoadError extends RwasmError {
  constructor(
    public readonly moduleName: string,
    public readonly cause?: unknown,
  ) {
    super(
      `Failed to load WASM module "${moduleName}": ${cause instanceof Error ? cause.message : String(cause)}`,
    );
    this.name = 'WasmLoadError';
  }
}

export class UnsupportedEnvironmentError extends RwasmError {
  constructor(environment: string) {
    super(
      `Unsupported environment: "${environment}". ` +
        'WASM loading requires a browser, Node.js, Deno, or Web Worker environment.',
    );
    this.name = 'UnsupportedEnvironmentError';
  }
}
