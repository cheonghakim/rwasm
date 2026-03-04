/** Load WASM bytes from the filesystem (Node.js) */
export async function loadNodeBytes(
  source: string | URL,
): Promise<ArrayBuffer> {
  const fs = await import('node:fs/promises');
  const url = await import('node:url');
  const path = await import('node:path');

  let filePath: string;

  if (source instanceof URL || (typeof source === 'string' && source.startsWith('file://'))) {
    filePath = url.fileURLToPath(source);
  } else if (
    typeof source === 'string' &&
    (source.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(source))
  ) {
    filePath = source;
  } else {
    filePath = path.resolve(process.cwd(), source.toString());
  }

  const buffer = await fs.readFile(filePath);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
}
