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

const CONFIG_TS = (dir: string) => `import { defineConfig } from 'rwasm';

export default defineConfig({
  crate: '${dir}',
  target: 'web',
  profile: 'release',
});
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

  // Add scripts to package.json if it exists
  const pkgPath = join(projectRoot, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkgContent = await readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgContent);
      const scripts = pkg.scripts ?? {};
      let modified = false;

      if (!scripts["wasm:build"]) {
        scripts["wasm:build"] = "rwasm build";
        modified = true;
      }
      if (!scripts["wasm:dev"]) {
        scripts["wasm:dev"] = "rwasm dev";
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
