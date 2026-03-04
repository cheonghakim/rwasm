import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

export interface RwasmWebpackOptions {
  /** Path to Rust crate. Default: auto-detected */
  crate?: string;
}

export class RwasmWebpackPlugin {
  private options: RwasmWebpackOptions;
  private watchStarted = false;
  private watchProcess: ChildProcess | null = null;

  constructor(options: RwasmWebpackOptions = {}) {
    this.options = options;
  }

  apply(compiler: any) {
    const pluginName = 'RwasmWebpackPlugin';

    // Enable async WASM experiments
    compiler.hooks.afterEnvironment.tap(pluginName, () => {
      compiler.options.experiments = {
        ...compiler.options.experiments,
        asyncWebAssembly: true,
      };
    });

    // Run build before compilation
    compiler.hooks.beforeCompile.tapPromise(pluginName, async () => {
      if (this.watchStarted) return; // Skip if watch is handling rebuilds

      const mode = compiler.options.mode === 'development' ? '--dev' : '--release';
      const args = ['rwasm', 'build', mode];
      if (this.options.crate) {
        args.push('--crate', resolve(this.options.crate));
      }

      execSync(`npx ${args.join(' ')}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    });

    // Start watch in watch mode
    compiler.hooks.watchRun.tapPromise(pluginName, async () => {
      if (this.watchStarted) return;
      this.watchStarted = true;

      const args = ['rwasm', 'dev'];
      if (this.options.crate) {
        args.push('--crate', resolve(this.options.crate));
      }

      this.watchProcess = spawn('npx', args, {
        stdio: 'pipe',
        cwd: process.cwd(),
        shell: process.platform === 'win32',
      });
    });

    // Cleanup on shutdown
    compiler.hooks.shutdown.tapPromise(pluginName, async () => {
      if (this.watchProcess) {
        this.watchProcess.kill();
        this.watchProcess = null;
      }
    });
  }
}

export default RwasmWebpackPlugin;
