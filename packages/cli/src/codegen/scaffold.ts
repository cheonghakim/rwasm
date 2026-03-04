import { existsSync } from "node:fs";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { log } from "../logger.js";

export interface ScaffoldOptions {
  name: string;
  dir: string;
  skipConfig: boolean;
}

const CARGO_TOML = (name: string) => `[package]
name = "${name}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"

[profile.release]
opt-level = "s"
lto = true
`;

const LIB_RS = `use wasm_bindgen::prelude::*;

// 두 숫자를 더합니다.
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 이름을 전달받아 인사말을 반환합니다.
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
`;

const CONFIG_TS = (
  dir: string,
) => `import { defineConfig } from '@cheonghakim/rwasm';

export default defineConfig({
  crate: '${dir}',
  target: 'web',
  profile: 'release',
});
`;

const INDEX_HTML = (name: string) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - rwasm</title>
    <style>
        body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f4f8; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #2d3748; margin-top: 0; }
        button { background: #4a5568; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
        button:hover { background: #2d3748; }
        #result { margin-top: 1rem; font-weight: bold; color: #4a5568; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${name} + rwasm</h1>
        <p>Rust WebAssembly + Vanilla JavaScript</p>
        <button id="btn">Call Rust add(10, 20)</button>
        <div id="result"></div>
    </div>

    <script type="module">
        // Import the generated wrapper
        import { wasmModule } from './pkg/index.js';

        const btn = document.getElementById('btn');
        const result = document.getElementById('result');

        btn.addEventListener('click', async () => {
            // .ready proxy automatically loads the WASM module
            const sum = await wasmModule.ready.add(10, 20);
            result.textContent = \`Result from Rust: \${sum}\`;
        });
    </script>
</body>
</html>
`;

export async function scaffoldRustCrate(
  projectRoot: string,
  options: ScaffoldOptions,
): Promise<void> {
  const crateDir = resolve(projectRoot, options.dir);

  if (existsSync(join(crateDir, "Cargo.toml"))) {
    log.warn(`Cargo.toml already exists at ${crateDir}. Skipping scaffold.`);
    return;
  }

  // Create directories
  await mkdir(join(crateDir, "src"), { recursive: true });

  // Write Cargo.toml
  await writeFile(
    join(crateDir, "Cargo.toml"),
    CARGO_TOML(options.name),
    "utf-8",
  );
  log.step(`Created ${join(crateDir, "Cargo.toml")}`);

  // Write src/lib.rs
  await writeFile(join(crateDir, "src", "lib.rs"), LIB_RS, "utf-8");
  log.step(`Created ${join(crateDir, "src", "lib.rs")}`);

  // Write rwasm.config.ts
  if (!options.skipConfig) {
    const configPath = join(projectRoot, "rwasm.config.ts");
    if (!existsSync(configPath)) {
      await writeFile(configPath, CONFIG_TS(options.dir), "utf-8");
      log.step(`Created rwasm.config.ts`);
    }
  }

  // Write index.html if it doesn't exist
  const htmlPath = join(projectRoot, "index.html");
  if (!existsSync(htmlPath)) {
    await writeFile(htmlPath, INDEX_HTML(options.name), "utf-8");
    log.step(`Created index.html`);
  }

  // Add scripts to package.json if it exists
  const pkgPath = join(projectRoot, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkgContent = await readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgContent);
      const scripts = pkg.scripts ?? {};
      let modified = false;

      if (!scripts["wasm:build"]) {
        scripts["wasm:build"] = "npx @cheonghakim/rwasm build";
        modified = true;
      }
      if (!scripts["wasm:dev"]) {
        scripts["wasm:dev"] = "npx @cheonghakim/rwasm dev";
        modified = true;
      }

      if (modified) {
        pkg.scripts = scripts;
        await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
        log.step("Added wasm:build and wasm:dev scripts to package.json");
      }
    } catch {
      log.warn("Could not update package.json scripts");
    }
  }
}
