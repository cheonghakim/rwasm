import type { WasmEnvironment } from "./types";

declare const WorkerGlobalScope: unknown;
declare const self: unknown;

/** 현재 실행 중인 런타임 환경을 감지합니다. */
export function detectEnvironment(): WasmEnvironment {
  // Deno
  if (typeof globalThis !== "undefined" && "Deno" in globalThis) {
    return "deno";
  }

  // Web Worker 및 Service Worker
  if (typeof self !== "undefined" && typeof WorkerGlobalScope !== "undefined") {
    return "worker";
  }

  // Node.js
  if (typeof process !== "undefined" && process.versions?.node) {
    return "node";
  }

  // Browser (window & document 존재 확인)
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return "browser";
  }

  // Cloudflare Workers 등 fetch가 가능한 기타 환경
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.fetch === "function"
  ) {
    return "browser";
  }

  return "unknown";
}
