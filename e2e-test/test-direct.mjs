// Test 1: wasm-bindgen의 JS glue를 직접 사용 (가장 기본적인 테스트)
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, 'rust', 'pkg', 'my_wasm_bg.wasm');

// wasm-bindgen --target web의 init 함수를 import
const { default: init, add, greet } = await import('./rust/pkg/my_wasm.js');

// Node.js에서는 URL 대신 ArrayBuffer로 전달해야 함
const wasmBytes = await readFile(wasmPath);
await init(wasmBytes.buffer);

// 테스트!
console.log('=== Direct wasm-bindgen Test ===');
console.log(`add(1, 2) = ${add(1, 2)}`);
console.log(`add(40, 2) = ${add(40, 2)}`);
console.log(`greet("World") = ${greet('World')}`);
console.log(`greet("Rust WASM") = ${greet('Rust WASM')}`);

// 검증
const results = [];
results.push(add(1, 2) === 3);
results.push(add(-5, 10) === 5);
results.push(greet('Test') === 'Hello, Test!');

if (results.every(Boolean)) {
  console.log('\n✅ All direct tests passed!');
} else {
  console.error('\n❌ Some tests failed!');
  process.exit(1);
}
