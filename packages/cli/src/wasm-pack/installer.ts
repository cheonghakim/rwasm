import { existsSync, createWriteStream } from 'node:fs';
import { mkdir, chmod } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { log } from '../logger.js';
import { WASM_PACK_VERSION } from './version.js';

const PLATFORM_MAP: Record<string, string> = {
  'darwin-x64': 'x86_64-apple-darwin',
  'darwin-arm64': 'aarch64-apple-darwin',
  'linux-x64': 'x86_64-unknown-linux-musl',
  'linux-arm64': 'aarch64-unknown-linux-musl',
  'win32-x64': 'x86_64-pc-windows-msvc',
};

function getCacheDir(): string {
  return resolve('node_modules', '.cache', 'rwasm', 'bin');
}

function getBinaryName(): string {
  return process.platform === 'win32' ? 'wasm-pack.exe' : 'wasm-pack';
}

/** Check if wasm-pack is available on PATH */
function findSystemWasmPack(): string | null {
  try {
    const cmd = process.platform === 'win32' ? 'where wasm-pack' : 'which wasm-pack';
    execSync(cmd, { stdio: 'pipe' });
    return 'wasm-pack';
  } catch {
    return null;
  }
}

/** Download and extract wasm-pack binary */
async function downloadWasmPack(destDir: string): Promise<string> {
  const platformKey = `${process.platform}-${process.arch}`;
  const target = PLATFORM_MAP[platformKey];
  if (!target) {
    throw new Error(
      `Unsupported platform: ${platformKey}. Please install wasm-pack manually: https://rustwasm.github.io/wasm-pack/installer/`,
    );
  }

  await mkdir(destDir, { recursive: true });

  const ext = process.platform === 'win32' ? '.zip' : '.tar.gz';
  const archiveName = `wasm-pack-v${WASM_PACK_VERSION}-${target}`;
  const url = `https://github.com/rustwasm/wasm-pack/releases/download/v${WASM_PACK_VERSION}/${archiveName}${ext}`;

  log.info(`Downloading wasm-pack v${WASM_PACK_VERSION}...`);
  log.step(url);

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download wasm-pack: ${response.status} ${response.statusText}`);
  }

  const binName = getBinaryName();
  const destPath = join(destDir, binName);

  if (ext === '.tar.gz') {
    // For tar.gz, we need to extract the binary
    // Use tar command which is available on macOS/Linux
    const tmpPath = join(destDir, `wasm-pack${ext}`);
    const fileStream = createWriteStream(tmpPath);
    await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream);
    execSync(`tar -xzf "${tmpPath}" -C "${destDir}" --strip-components=1`, { stdio: 'pipe' });
    // Clean up archive
    const { unlink } = await import('node:fs/promises');
    await unlink(tmpPath).catch(() => {});
  } else {
    // Windows .zip — save and use PowerShell to extract
    const tmpPath = join(destDir, 'wasm-pack.zip');
    const fileStream = createWriteStream(tmpPath);
    await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream);
    execSync(
      `powershell -Command "Expand-Archive -Path '${tmpPath}' -DestinationPath '${destDir}' -Force"`,
      { stdio: 'pipe' },
    );
    // Move binary from nested folder to dest
    const nestedBin = join(destDir, `wasm-pack-v${WASM_PACK_VERSION}-${target}`, binName);
    if (existsSync(nestedBin)) {
      const { rename } = await import('node:fs/promises');
      await rename(nestedBin, destPath);
    }
    const { unlink } = await import('node:fs/promises');
    await unlink(tmpPath).catch(() => {});
  }

  if (process.platform !== 'win32') {
    await chmod(destPath, 0o755);
  }

  log.success(`wasm-pack v${WASM_PACK_VERSION} installed to ${destDir}`);
  return destPath;
}

/**
 * Ensure wasm-pack is available.
 * 1. Check PATH
 * 2. Check local cache
 * 3. Download to cache
 */
export async function ensureWasmPack(): Promise<string> {
  // 1. System-installed
  const systemBin = findSystemWasmPack();
  if (systemBin) {
    return systemBin;
  }

  // 2. Cached
  const cacheDir = getCacheDir();
  const cachedBin = join(cacheDir, getBinaryName());
  if (existsSync(cachedBin)) {
    return cachedBin;
  }

  // 3. Download
  return downloadWasmPack(cacheDir);
}
