import type { Plugin, ViteDevServer } from 'vite';
import { spawn, execSync, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

export interface RwasmViteOptions {
  /** Path to Rust crate (relative to project root). Default: auto-detected */
  crate?: string;
  /** Watch Rust files in dev mode. Default: true */
  watch?: boolean;
  /** Profile for dev builds. Default: 'dev' */
  devProfile?: 'dev' | 'release';
}

export default function rwasmVite(options: RwasmViteOptions = {}): Plugin {
  let server: ViteDevServer | null = null;
  let watchProcess: ChildProcess | null = null;

  return {
    name: 'rwasm',

    configureServer(srv) {
      server = srv;

      // Serve .wasm files with correct MIME type
      srv.middlewares.use((req, res, next) => {
        if (req.url?.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm');
        }
        next();
      });
    },

    buildStart() {
      if (server && options.watch !== false) {
        // Dev mode: start rwasm dev in background
        const args = ['rwasm', 'dev'];
        if (options.crate) {
          args.push('--crate', resolve(options.crate));
        }

        watchProcess = spawn('npx', args, {
          stdio: 'pipe',
          cwd: process.cwd(),
          shell: process.platform === 'win32',
        });

        watchProcess.stdout?.on('data', (data: Buffer) => {
          const msg = data.toString();
          if (msg.includes('Rebuilt') || msg.includes('Build completed')) {
            // Trigger full reload when WASM is rebuilt
            server?.ws.send({ type: 'full-reload' });
          }
        });

        watchProcess.stderr?.on('data', (data: Buffer) => {
          console.error(`[rwasm] ${data.toString()}`);
        });
      }
    },

    closeBundle() {
      if (!server) {
        // Production build: run rwasm build synchronously
        try {
          const args = ['rwasm', 'build', '--release'];
          if (options.crate) {
            args.push('--crate', resolve(options.crate));
          }
          execSync(`npx ${args.join(' ')}`, {
            stdio: 'inherit',
            cwd: process.cwd(),
          });
        } catch (err) {
          console.error('[rwasm] Production build failed:', err);
          throw err;
        }
      }

      // Clean up watch process
      if (watchProcess) {
        watchProcess.kill();
        watchProcess = null;
      }
    },
  };
}
