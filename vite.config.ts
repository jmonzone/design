import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/**
 * Library build: one ES module per entry, React and three left to the host. Each component family is its own entry,
 * so an app importing only Button never loads three. styles.css and fonts/ are copied as-is by the build script.
 */
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: entry("./src/index.ts"),
        "pack-opener": entry("./src/pack-opener/index.ts"),
        "pack-opener-react": entry("./src/pack-opener/react/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [/^react(\/.*)?$/, /^three(\/.*)?$/],
    },
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: true,
  },
});
