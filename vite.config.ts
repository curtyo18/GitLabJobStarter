import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import webExtension from "vite-plugin-web-extension";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

export default defineConfig({
  plugins: [
    webExtension({
      manifest: () => ({
        ...JSON.parse(
          readFileSync(new URL("./manifest.json", import.meta.url), "utf-8"),
        ),
        version,
      }),
    }),
  ],
  build: {
    emptyOutDir: true,
  },
});
