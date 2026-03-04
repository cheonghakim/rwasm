# @cheonghakim/rwasm

Rust WebAssembly를 JS/TS 프로젝트에서 쉽게 쓰기 위한 도구

wasm-pack 설치, 빌드 타겟 설정, 환경별 import 차이 같은 번거로운 과정을 자동화

## 설치

```bash
npm install -D @cheonghakim/rwasm @cheonghakim/core
```

## 시작하기

```bash
# Rust 크레이트 생성
npx @cheonghakim/rwasm init --name my-wasm

# WASM 빌드
npx @cheonghakim/rwasm build

# 개발 모드 (파일 변경 시 자동 리빌드)
npx @cheonghakim/rwasm dev
```

`rwasm init`을 실행하면 아래 구조가 만들어진다:

```
your-project/
├── rust/
├── Cargo.toml
│   └── src/
│       └── lib.rs        ← Rust 코드
├── rwasm.config.ts
└── package.json          ← wasm:build, wasm:dev 스크립트 추가됨
```

생성되는 Rust 코드:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

## 사용법

### 기본

```typescript
import { wasmModule } from "./rust/pkg";

const wasm = await wasmModule.load();
wasm.add(1, 2); // 3
wasm.greet("World"); // "Hello, World!"
```

### 자동 초기화 프록시

`load()`를 따로 호출하지 않아도 된다. 첫 호출 시 자동으로 초기화된다

```typescript
import { wasmModule } from "./rust/pkg";

await wasmModule.ready.add(1, 2); // 3
await wasmModule.ready.greet("World"); // "Hello, World!"
```

### Vanilla HTML (번들러 없이)

```html
<script type="importmap">
  {
    "imports": {
      "@cheonghakim/core": "./node_modules/@cheonghakim/core/dist/index.mjs"
    }
  }
</script>

<script type="module">
  import { wasmModule } from "./rust/pkg/index.js";

  const wasm = await wasmModule.load();
  document.body.textContent = wasm.greet("Browser");
</script>
```

### Node.js

```typescript
import { wasmModule } from "./rust/pkg/index.js";

const wasm = await wasmModule.load();
console.log(wasm.add(40, 2)); // 42
```

## 번들러 플러그인

### Vite

```bash
npm install -D @cheonghakim/vite
```

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import rwasm from "@cheonghakim/vite";

export default defineConfig({
  plugins: [rwasm({ crate: "./rust" })],
});
```

개발 모드에서 Rust 파일 변경 시 자동 리빌드 + 브라우저 리로드

### Webpack

```bash
npm install -D @cheonghakim/webpack
```

```javascript
// webpack.config.js
const { RwasmWebpackPlugin } = require("@cheonghakim/webpack");

module.exports = {
  plugins: [new RwasmWebpackPlugin({ crate: "./rust" })],
};
```

### Next.js

```bash
npm install -D @cheonghakim/nextjs
```

```javascript
// next.config.mjs
import { withRwasm } from "@cheonghakim/nextjs";

export default withRwasm({
  // Next.js 설정
});
```

## 설정

프로젝트 루트에 `rwasm.config.ts`를 두면 된다

```typescript
import { defineConfig } from "@cheonghakim/rwasm";

export default defineConfig({
  crate: "./rust",
  target: "web", // 'web' | 'bundler' | 'nodejs' | 'no-modules'
  profile: "release", // 'dev' | 'release'
  wasmOpt: "-O2", // false로 비활성화 가능
  watch: {
    include: ["src"],
    ignore: ["**/target/**"],
    debounce: 300,
  },
});
```

## CLI

| 명령어        | 설명                    |
| ------------- | ----------------------- |
| `rwasm init`  | Rust 크레이트 스캐폴딩  |
| `rwasm build` | WASM 빌드               |
| `rwasm dev`   | 파일 감시 + 자동 리빌드 |

```
npx @cheonghakim/rwasm init [options]
  -n, --name <name>   크레이트 이름 (기본: wasm-lib)
  -d, --dir <path>    크레이트 디렉토리 (기본: ./rust)
  --no-config         rwasm.config.ts 생성 안 함

npx @cheonghakim/rwasm build [options]
  --dev               개발 모드 (최적화 없이 빠르게)
  --release           릴리즈 모드 (기본)
  --target <target>   빌드 타겟 (기본: web)
  --out-dir <path>    출력 디렉토리
  --crate <path>      크레이트 경로

npx @cheonghakim/rwasm dev [options]
  --crate <path>      크레이트 경로
  --debounce <ms>     디바운스 간격 (기본: 300)
```

## 동작 원리

1. `rwasm build` 실행 시 시스템에 wasm-pack이 없으면 자동으로 다운로드
2. `wasm-pack build --target web`으로 `.wasm` + JS glue + TypeScript 타입 생성
3. `@cheonghakim/core`와 연동되는 래퍼(`index.ts`)를 자동 생성
4. 래퍼의 `createWasmLoader`가 환경(브라우저/Node.js/Worker)을 감지해서 적절한 방식으로 WASM을 로드

## 패키지 구조

| 패키지                 | 설명                          |
| ---------------------- | ----------------------------- |
| `@cheonghakim/rwasm`   | CLI 도구                      |
| `@cheonghakim/core`    | 런타임 로더 (zero-dependency) |
| `@cheonghakim/vite`    | Vite 플러그인                 |
| `@cheonghakim/webpack` | Webpack 플러그인              |
| `@cheonghakim/nextjs`  | Next.js 플러그인              |

## 요구 사항

- Node.js >= 18
- [Rust 툴체인](https://rustup.rs/) (rustc, cargo)
- wasm32-unknown-unknown 타겟 (`rustup target add wasm32-unknown-unknown`)

wasm-pack은 없어도 된다. 첫 빌드 시 자동 설치된다.

## 라이선스

MIT
