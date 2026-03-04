import { detectEnvironment } from "./env-detect";
import { loadBrowserBytes } from "./adapters/browser-adapter";
import { loadNodeBytes } from "./adapters/node-adapter";
import { WasmLoadError } from "./errors";
import type {
  LoadOptions,
  WasmLoaderConfig,
  WasmLoader,
  WasmReadyProxy,
} from "./types";

// 이미 로드된 모듈 재사용을 위한 캐시
const initCache = new Map<string, Promise<unknown>>();

/**
 * WASM 모듈을 로드하고 초기화합니다.
 * 실행 환경을 자동으로 감지하여 적절한 로딩 전략을 선택합니다.
 *
 * @param initFn - wasm-bindgen에서 생성된 init 함수
 * @param wasmSource - .wasm 파일의 경로 또는 URL
 * @param options - 추가 로딩 옵션
 */
export async function loadWasm<T = unknown>(
  initFn: (input?: RequestInfo | URL | BufferSource) => Promise<T>,
  wasmSource: string | URL,
  options: LoadOptions = {},
): Promise<T> {
  const env = options.environment ?? detectEnvironment();

  switch (env) {
    case "browser":
    case "worker":
    case "deno":
      // 브라우저 환경: URL을 직접 전달 (fetch + instantiateStreaming)
      return initFn(
        wasmSource instanceof URL ? wasmSource : new URL(wasmSource),
      );

    case "node": {
      // Node.js: 파일을 바이트로 읽어서 전달
      const bytes = await loadNodeBytes(wasmSource);
      return initFn(bytes);
    }

    default:
      // 폴백: URL 기반 로딩 시도 후 실패하면 버퍼 기반 로딩 시도
      try {
        return await initFn(
          wasmSource instanceof URL ? wasmSource : new URL(wasmSource),
        );
      } catch {
        const bytes = await loadBrowserBytes(wasmSource.toString());
        return initFn(bytes);
      }
  }
}

/**
 * 지연 로딩(Lazy-loading)이 가능한 WASM 모듈 래퍼를 생성합니다.
 *
 * @example
 * ```ts
 * const wasm = createWasmLoader({
 *   name: 'my-crate',
 *   init,
 *   wasmUrl: new URL('./pkg/my_crate_bg.wasm', import.meta.url),
 *   exports: wasmExports,
 * });
 *
 * // 명시적 로드
 * const mod = await wasm.load();
 * mod.add(1, 2);
 *
 * // 프록시를 통한 자동 로드
 * await wasm.ready.add(1, 2);
 * ```
 */
export function createWasmLoader<T extends Record<string, unknown>>(
  config: WasmLoaderConfig<T>,
): WasmLoader<T> {
  let isInitialized = false;

  const ensureInit = async (options?: LoadOptions): Promise<void> => {
    if (isInitialized) return;

    const cacheKey = config.name;
    if (!options?.noCache && initCache.has(cacheKey)) {
      await initCache.get(cacheKey);
      isInitialized = true;
      return;
    }

    const promise = loadWasm(config.init, config.wasmUrl, options).then(() => {
      isInitialized = true;
    });

    if (!options?.noCache) {
      initCache.set(cacheKey, promise);
    }

    try {
      await promise;
    } catch (error) {
      initCache.delete(cacheKey);
      throw new WasmLoadError(config.name, error);
    }
  };

  const ready = new Proxy({} as WasmReadyProxy<T>, {
    get(_target, prop: string) {
      return async (...args: unknown[]) => {
        await ensureInit();
        const value = (config.exports as Record<string, unknown>)[prop];
        if (typeof value === "function") {
          return value(...args);
        }
        return value;
      };
    },
  });

  return {
    load: async (options?: LoadOptions): Promise<T> => {
      await ensureInit(options);
      return config.exports;
    },
    ready,
    get initialized() {
      return isInitialized;
    },
  };
}
