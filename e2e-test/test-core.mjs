// Test 2: @cheonghakim/core의 loadWasm + createWasmLoader 테스트
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadWasm, createWasmLoader } from "../packages/core/dist/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, "rust", "pkg", "my_wasm_bg.wasm");

// wasm-bindgen의 init + exports를 import
const wasmModule = await import("./rust/pkg/my_wasm.js");
const init = wasmModule.default;
const { add, greet } = wasmModule;

console.log("=== @cheonghakim/core loadWasm Test ===");

// Test loadWasm (low-level API)
await loadWasm(init, wasmPath, { environment: "node" });
console.log(`loadWasm + add(3, 4) = ${add(3, 4)}`);
console.log(`loadWasm + greet("Core") = ${greet("Core")}`);

console.log("\n=== @cheonghakim/core createWasmLoader Test ===");

// createWasmLoader (high-level API) — 이미 init된 상태이므로 새 인스턴스 필요
// 대신 createWasmLoader의 구조를 테스트
const loader = createWasmLoader({
  name: "my-wasm-test",
  init: async () => {
    /* already initialized above */
  },
  wasmUrl: wasmPath,
  exports: { add, greet },
});

// .load() 테스트
const exports = await loader.load();
console.log(`loader.load() + add(10, 20) = ${exports.add(10, 20)}`);
console.log(`loader.initialized = ${loader.initialized}`);

// .ready 프록시 테스트
const result = await loader.ready.add(100, 200);
console.log(`loader.ready.add(100, 200) = ${result}`);

const greeting = await loader.ready.greet("Proxy");
console.log(`loader.ready.greet("Proxy") = ${greeting}`);

// 검증
const results = [];
results.push(add(3, 4) === 7);
results.push(greet("Core") === "Hello, Core!");
results.push(exports.add(10, 20) === 30);
results.push(loader.initialized === true);
results.push(result === 300);
results.push(greeting === "Hello, Proxy!");

if (results.every(Boolean)) {
  console.log("\n✅ All @cheonghakim/core tests passed!");
} else {
  console.error("\n❌ Some tests failed!");
  process.exit(1);
}
