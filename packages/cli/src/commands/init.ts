import { execSync } from "node:child_process";
import { log } from "../logger.js";
import { scaffoldRustCrate } from "../codegen/scaffold.js";

interface InitOptions {
  name: string;
  dir: string;
  config: boolean; // commander uses --no-config → config: false
}

export async function initCommand(options: InitOptions): Promise<void> {
  const projectRoot = process.cwd();

  log.info("Initializing Rust WASM project...");

  // Check Rust toolchain
  try {
    execSync("rustc --version", { stdio: "pipe" });
    log.step("Rust toolchain found");
  } catch {
    log.error("Rust is not installed. Install it from https://rustup.rs/");
    process.exit(1);
  }

  // Check wasm32 target
  try {
    const targets = execSync("rustup target list --installed", {
      encoding: "utf-8",
      stdio: "pipe",
    });
    if (!targets.includes("wasm32-unknown-unknown")) {
      log.step("Adding wasm32-unknown-unknown target...");
      execSync("rustup target add wasm32-unknown-unknown", {
        stdio: "inherit",
      });
    }
  } catch {
    log.warn(
      "Could not verify wasm32 target. You may need to run: rustup target add wasm32-unknown-unknown",
    );
  }

  // Scaffold
  await scaffoldRustCrate(projectRoot, {
    name: options.name,
    dir: options.dir,
    skipConfig: !options.config,
  });

  log.success("Rust WASM 프로젝트가 성공적으로 준비되었습니다!");
  console.log("");
  console.log("다음 단계:");
  console.log(
    `  1. 패키지 설치: npm install -D @cheonghakim/rwasm @cheonghakim/core`,
  );
  console.log(`  2. WASM 빌드: npx @cheonghakim/rwasm build`);
  console.log(`  3. 프로젝트에서 사용하기:`);
  console.log("");
  const importPath = options.dir.startsWith("./")
    ? options.dir.slice(2)
    : options.dir;
  console.log(`     import { wasmModule } from './${importPath}/pkg';`);
  console.log(`     const wasm = await wasmModule.load();`);
  console.log(`     console.log(wasm.add(1, 2));`);
  console.log("");
}
