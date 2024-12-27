import { resolve } from "path";
import { mergeConfig, defineConfig } from "vite";
import { crx, ManifestV3Export } from "@crxjs/vite-plugin";
import baseConfig, { baseManifest, baseBuildOptions } from "./vite.config.base";

const outDir = resolve(__dirname, "dist_chrome");

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      crx({
        manifest: {
          ...baseManifest,
          permissions: ["activeTab", "contextMenus", "sidePanel"],
          side_panel: {
            default_path: "src/pages/panel/index.html",
          },
          background: {
            service_worker: "src/pages/background/index.ts",
            type: "module",
          },
          minimum_chrome_version: "114",
        } as ManifestV3Export,
        browser: "chrome",
        contentScripts: {
          injectCss: true,
        },
      }),
    ],
    build: {
      ...baseBuildOptions,
      outDir,
    },
  })
);
