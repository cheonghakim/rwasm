import { resolve, join } from 'node:path';
import { watch } from 'chokidar';
import { log } from '../logger.js';
import { loadConfig } from '../config/loader.js';
import { buildCommand } from './build.js';

interface DevCommandOptions {
  crate?: string;
  debounce?: string;
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T;
}

export async function devCommand(options: DevCommandOptions): Promise<void> {
  const config = await loadConfig();
  const cratePath = resolve(options.crate ?? config.crate);
  const debounceMs = Number(options.debounce) || config.watch?.debounce || 300;

  log.info('Starting watch mode...');

  // Initial build (dev profile for speed)
  try {
    await buildCommand({ crate: cratePath, dev: true });
  } catch (err) {
    log.error(`Initial build failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Determine watch paths
  const watchDirs = (config.watch?.include ?? ['src']).map((dir) =>
    join(cratePath, dir),
  );
  // Also watch Cargo.toml for dependency changes
  watchDirs.push(join(cratePath, 'Cargo.toml'));

  const ignorePaths = config.watch?.ignore ?? ['**/target/**'];

  // Set up file watcher
  const watcher = watch(watchDirs, {
    ignored: ignorePaths,
    persistent: true,
    ignoreInitial: true,
  });

  const rebuild = debounce(async () => {
    log.info('Changes detected, rebuilding...');
    const start = performance.now();
    try {
      await buildCommand({ crate: cratePath, dev: true });
      const elapsed = Math.round(performance.now() - start);
      log.success(`Rebuilt in ${elapsed}ms`);
    } catch (err) {
      log.error(`Build failed: ${err instanceof Error ? err.message : String(err)}`);
      // Don't crash — keep watching
    }
  }, debounceMs);

  watcher.on('change', rebuild);
  watcher.on('add', rebuild);
  watcher.on('unlink', rebuild);

  log.info(`Watching ${watchDirs.join(', ')} for changes...`);
  log.step(`Debounce: ${debounceMs}ms`);

  // Graceful shutdown
  const cleanup = () => {
    log.info('Stopping watch mode...');
    watcher.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
