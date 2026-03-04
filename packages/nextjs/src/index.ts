export interface RwasmNextOptions {
  /** Path to Rust crate. Default: auto-detected */
  crate?: string;
}

/**
 * Wrap your Next.js config with WASM support.
 *
 * @example
 * ```js
 * // next.config.mjs
 * import { withRwasm } from '@cheonghakim/nextjs';
 *
 * export default withRwasm({
 *   // your Next.js config
 * });
 * ```
 */
export function withRwasm(
  nextConfig: Record<string, any> = {},
  rwasmOptions: RwasmNextOptions = {},
): Record<string, any> {
  return {
    ...nextConfig,

    webpack(config: any, context: any) {
      // Enable async WASM
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };

      // Handle .wasm files as assets
      config.module.rules.push({
        test: /\.wasm$/,
        type: "asset/resource",
      });

      // Set correct output path for WASM files
      if (context.isServer) {
        config.output.webassemblyModuleFilename =
          "./../static/wasm/[modulehash].wasm";
      } else {
        config.output.webassemblyModuleFilename =
          "static/wasm/[modulehash].wasm";
      }

      // Chain user's webpack config
      if (typeof nextConfig.webpack === "function") {
        return nextConfig.webpack(config, context);
      }

      return config;
    },
  };
}

export default withRwasm;
