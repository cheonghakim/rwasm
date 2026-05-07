# @cheonghakim/rwasm

[English](#english) | [한국어](#한국어)

---

<a name="english"></a>
## English

Rust WebAssembly tool for seamless JS/TS integration.

### 🌟 Introduction
`@cheonghakim/rwasm` is built to radically simplify the integration of Rust WebAssembly (WASM) into modern JavaScript/TypeScript projects. It automates the tedious processes such as `wasm-pack` installation, build target configuration, and environment-specific loading logic.

#### Intent & Purpose
*   **Eliminate Complexity**: Removes the barrier to entry for WASM by automating toolchain management and boilerplate code generation.
*   **Consistent Experience**: Enables a unified way to use WASM across Browsers, Node.js, and Next.js.
*   **Developer Productivity**: Provides a "JS-like" developer experience with instant feedback via automatic rebuilds and HMR.

### 🚀 Key Features & Advantages
*   **Zero-Config Management**: Automatically downloads and manages `wasm-pack` if not present in the system.
*   **Universal Loader**: Smartly detects the environment (Browser/Node/Worker) and applies the optimal WASM loading strategy.
*   **Bundler-Native**: First-class support for Vite, Webpack, and Next.js with Hot Module Replacement (HMR).
*   **Proxy-based Lazy Loading**: Call WASM functions directly without manual initialization; they load automatically on first use.
*   **Type Safety**: Automatically generates and wraps TypeScript definitions for a seamless IDE experience.

### 📦 Installation
```bash
npm install -D @cheonghakim/rwasm @cheonghakim/core
```

### ⚡ Quick Start
```bash
# Initialize a Rust crate
npx @cheonghakim/rwasm init --name my-wasm

# Build WASM
npx @cheonghakim/rwasm build

# Dev mode (Auto-rebuild on file changes)
npx @cheonghakim/rwasm dev
```

Executing `rwasm init` creates the following structure:
```
your-project/
├── rust/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs        ← Your Rust code
├── rwasm.config.ts
└── package.json          ← wasm:build, wasm:dev scripts added
```

### 🛠 Usage

#### Basic Loading
```typescript
import { wasmModule } from "./rust/pkg";

const wasm = await wasmModule.load();
wasm.add(1, 2); // 3
wasm.greet("World"); // "Hello, World!"
```

#### Auto-Initialization Proxy
Call functions directly. They will be initialized automatically on the first call.
```typescript
import { wasmModule } from "./rust/pkg";

await wasmModule.ready.add(1, 2); // 3
await wasmModule.ready.greet("World"); // "Hello, World!"
```

---

<a name="한국어"></a>
## 한국어

JS/TS 프로젝트에서 Rust WebAssembly를 쉽고 강력하게 사용하기 위한 도구입니다.

### 🌟 소개
`@cheonghakim/rwasm`은 Rust WebAssembly(WASM)를 현대적인 JavaScript/TypeScript 프로젝트에 통합하는 과정을 혁신적으로 단순화합니다. `wasm-pack` 설치, 빌드 타겟 설정, 환경별 임포트 차이 해결 등 번거로운 모든 과정을 자동화합니다.

#### 의도 및 목적
*   **복잡성 제거**: 툴체인 관리와 반복적인 보일러플레이트 코드 작성을 자동화하여 WASM 도입 장벽을 낮춥니다.
*   **일관된 경험**: 브라우저, Node.js, Next.js 등 어떤 환경에서도 동일한 인터페이스로 WASM을 사용할 수 있게 합니다.
*   **개발자 생산성**: Rust 코드 변경 시 즉각적인 리빌드와 HMR을 지원하여 JS 개발 환경과 같은 생산성을 제공합니다.

### 🚀 주요 특징 및 장점
*   **Zero-Config Management**: 시스템에 `wasm-pack`이 없어도 첫 빌드 시 자동으로 다운로드하고 관리합니다.
*   **Universal Loader**: 브라우저, Node.js, Worker 등 실행 환경을 자동 감지하여 최적의 로딩 방식을 선택합니다.
*   **Bundler-Native**: Vite, Webpack, Next.js용 전용 플러그인을 제공하며 HMR을 완벽히 지원합니다.
*   **Proxy 기반 지연 로딩**: `load()`를 직접 호출하지 않아도 첫 함수 호출 시 자동으로 초기화됩니다.
*   **강력한 타입 안정성**: 빌드 시 TypeScript 정의를 자동 생성하여 완벽한 코드 힌트와 타입 체크를 제공합니다.

### 📦 설치
```bash
npm install -D @cheonghakim/rwasm @cheonghakim/core
```

### ⚡ 시작하기
```bash
# Rust 크레이트 생성
npx @cheonghakim/rwasm init --name my-wasm

# WASM 빌드
npx @cheonghakim/rwasm build

# 개발 모드 (파일 변경 시 자동 리빌드)
npx @cheonghakim/rwasm dev
```

`rwasm init`을 실행하면 아래 구조가 만들어집니다:
```
your-project/
├── rust/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs        ← Rust 코드
├── rwasm.config.ts
└── package.json          ← wasm:build, wasm:dev 스크립트 추가됨
```

### 🛠 사용법

#### 기본 로딩
```typescript
import { wasmModule } from "./rust/pkg";

const wasm = await wasmModule.load();
wasm.add(1, 2); // 3
```

#### 자동 초기화 프록시
`load()`를 따로 호출할 필요가 없습니다. 첫 호출 시 자동으로 로드됩니다.
```typescript
import { wasmModule } from "./rust/pkg";

// 첫 호출 시 초기화가 시작되므로 await가 필요합니다.
await wasmModule.ready.add(1, 2); // 3
```

### 💡 고급 사용법

#### Next.js & SSR
`Universal Loader`는 실행 환경을 자동으로 감지합니다. Next.js와 같은 SSR 환경에서는 다음과 같이 동작합니다:
- **서버 사이드**: `fs` 모듈을 통해 로컬 파일 시스템에서 WASM을 로드합니다.
- **클라이언트 사이드**: `fetch` API를 통해 네트워크에서 WASM을 로드합니다.

`wasmModule.ready`를 사용하면 양쪽 환경 모두에서 적절한 로딩이 완료될 때까지 안전하게 대기합니다.

#### 여러 개의 크레이트 관리
`rwasm.config.ts`는 기본적으로 하나의 크레이트를 정의하지만, CLI 플래그를 통해 여러 크레이트를 관리할 수 있습니다:
```bash
npx rwasm build --crate ./crate-a --out-dir ./dist/a
npx rwasm build --crate ./crate-b --out-dir ./dist/b
```

#### TypeScript 타입 활용
`pkg` 디렉토리에는 빌드 시 생성된 `.d.ts` 파일이 포함되어 있습니다. Rust에서 `#[wasm_bindgen]`으로 내보낸 모든 함수에 대해 IDE의 자동 완성 기능을 완벽하게 사용할 수 있습니다.

---

## 🔌 Bundler Plugins

### Vite
```bash
npm install -D @cheonghakim/vite
```

```typescript
// vite.config.ts
import rwasm from "@cheonghakim/vite";

export default {
  plugins: [rwasm({ crate: "./rust" })],
};
```

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
  // Next.js configuration
});
```

---

## ⚙️ Configuration (`rwasm.config.ts`)

```typescript
import { defineConfig } from "@cheonghakim/rwasm";

export default defineConfig({
  crate: "./rust",
  target: "web", // 'web' | 'bundler' | 'nodejs' | 'no-modules'
  profile: "release", // 'dev' | 'release'
  wasmOpt: "-O2", 
  watch: {
    include: ["src"],
    debounce: 300,
  },
  // Hook: runs after build completes
  afterBuild: async (output) => {
    console.log(`Built ${output.wasmFile} in ${output.duration}ms`);
  }
});
```

### 🎯 Configuration Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `crate` | `string` | Path to the Rust crate directory. |
| `target` | `string` | `web` (default), `bundler`, `nodejs`, `no-modules`. |
| `profile` | `string` | `release` (default), `dev`, `profiling`. |
| `wasmOpt` | `string` | `wasm-opt` level (e.g., `-O2`). Set `false` to disable. |
| `afterBuild`| `function` | Async hook that receives build metadata. |

---

## 💻 CLI Reference

### `rwasm init`
Scaffold a new Rust crate.
- `-n, --name <name>`: Crate name (default: `wasm-lib`).
- `-d, --dir <path>`: Directory path (default: `./rust`).
- `--no-config`: Skip generating `rwasm.config.ts`.

### `rwasm build`
Build the Rust crate into WASM.
- `--release`: Build in release mode (default).
- `--dev`: Build in dev mode (faster, no optimizations).
- `--target <target>`: Override the build target.
- `--crate <path>`: Override the crate path.
- `--out-dir <path>`: Override the output directory.

### `rwasm dev`
Watch for changes and rebuild automatically.
- `--crate <path>`: Crate path to watch.
- `--debounce <ms>`: Debounce interval (default: `300`).

---

## 💡 Advanced Usage

### Next.js & SSR
The `Universal Loader` automatically handles environment detection. However, in SSR environments like Next.js:
- **Server-side**: WASM is loaded using `fs` (Node.js).
- **Client-side**: WASM is loaded using `fetch`.

If you use `wasmModule.ready`, it will wait for the appropriate loading mechanism to finish on both sides.

### Multiple Crates
While `rwasm.config.ts` typically defines one crate, you can manage multiple crates by creating separate config files or using CLI flags:
```bash
npx rwasm build --crate ./crate-a --out-dir ./dist/a
npx rwasm build --crate ./crate-b --out-dir ./dist/b
```

### Using Generated Types
The `pkg` directory contains full TypeScript definitions (`.d.ts`). Your IDE should automatically provide intellisense for all `#[wasm_bindgen]` functions exported from Rust.

---

## 📖 How it works

1.  **Auto Toolchain**: Automatically downloads `wasm-pack` if missing.
2.  **Build Pipeline**: Runs `wasm-pack build` and generates JS glue code + TS types.
3.  **Core Wrapper**: Generates a wrapper (`index.ts`) that integrates with `@cheonghakim/core`.
4.  **Runtime Loading**: The generated loader detects the environment at runtime and loads the `.wasm` file using the appropriate method (fetch, fs, etc.).

---

## 📂 Package Structure

*   `@cheonghakim/rwasm`: CLI tool for project management.
*   `@cheonghakim/core`: Zero-dependency runtime loader.
*   `@cheonghakim/vite`, `webpack`, `nextjs`: Framework-specific plugins.

---

## ⚠️ Requirements

- Node.js >= 18
- [Rust Toolchain](https://rustup.rs/) (rustc, cargo)
- `wasm32-unknown-unknown` target

---

## 📄 License

MIT
