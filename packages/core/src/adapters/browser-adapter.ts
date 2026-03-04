/** Load WASM bytes via fetch (browser, worker, Deno) */
export async function loadBrowserBytes(
  source: string | URL,
  fetchOptions?: RequestInit,
): Promise<ArrayBuffer> {
  const response = await fetch(source, fetchOptions);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch WASM: ${response.status} ${response.statusText}`,
    );
  }
  return response.arrayBuffer();
}
