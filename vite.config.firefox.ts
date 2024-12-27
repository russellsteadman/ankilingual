import { resolve } from "path";
import { mergeConfig, defineConfig } from "vite";
import { crx, ManifestV3Export } from "@crxjs/vite-plugin";
import baseConfig, { baseManifest, baseBuildOptions } from "./vite.config.base";

const outDir = resolve(__dirname, "dist_firefox");

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      crx({
        manifest: {
          ...baseManifest,
          permissions: ["activeTab", "contextMenus"],
          ...{
            sidebar_action: {
              default_title: "Create flashcard",
              default_panel: "src/pages/panel/index.html",
              default_icon: "icon-128.png",
              open_at_install: false,
            },
          },
          background: {
            scripts: ["src/pages/background/index.ts"],
          },
          ...{
            browser_specific_settings: {
              gecko: {
                strict_min_version: "118.0",
              },
            },
          },
        } as ManifestV3Export,
        browser: "firefox",
        contentScripts: {
          injectCss: true,
        },
      }),
    ],
    build: {
      ...baseBuildOptions,
      outDir,
    },
    publicDir: resolve(__dirname, "public"),
  })
);
