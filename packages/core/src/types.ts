/** 감지된 런타임 환경 */
export type WasmEnvironment =
  | "browser"
  | "node"
  | "deno"
  | "worker"
  | "unknown";

/** WASM 로드 옵션 */
export interface LoadOptions {
  /** fetch 옵션 (브라우저 전용) */
  fetchOptions?: RequestInit;
  /** WebAssembly.instantiate에 전달할 임포트 객체 */
  importObject?: WebAssembly.Imports;
  /** 환경 강제 지정 */
  environment?: WasmEnvironment;
  /** 캐시 사용 여부 (기본값: false) */
  noCache?: boolean;
}

/** createWasmLoader 설정 */
export interface WasmLoaderConfig<T> {
  /** 캐시 및 에러 메시지에 사용할 이름 */
  name: string;
  /** wasm-bindgen의 init 함수 */
  init: (input?: RequestInfo | URL | BufferSource) => Promise<unknown>;
  /** .wasm 파일 경로 */
  wasmUrl: URL | string;
  /** 모듈 익스포트 객체 */
  exports: T;
}

/** 지연 로딩을 지원하는 WASM 모듈 래퍼 */
export interface WasmLoader<T extends Record<string, unknown>> {
  /** 모듈을 즉시 초기화하고 익스포트를 반환합니다. */
  load(options?: LoadOptions): Promise<T>;
  /**
   * 첫 속성 접근 시 자동 초기화되는 프록시 객체.
   * 모든 메서드 호출은 Promise를 반환합니다.
   */
  ready: WasmReadyProxy<T>;
  /** 초기화 여부 */
  readonly initialized: boolean;
}

/** WASM 익스포트를 비동기로 변환하는 타입 */
export type WasmReadyProxy<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : Promise<T[K]>;
};
