import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/** Library build: one ES module, React left to the host. styles.css and fonts/ are copied as-is by the build script. */
export default defineConfig({
  build: {
    lib: {
      entry: { index: fileURLToPath(new URL("./src/index.ts", import.meta.url)) },
      formats: ["es"],
    },
    rollupOptions: {
      external: [/^react(\/.*)?$/],
    },
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: true,
  },
});
