import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import packageJson from "./package.json" with { type: "json" };
import { createViteOptions } from "./scripts/vite-options.mjs";

export default defineConfig({
  ...createViteOptions({ backendPort: 33770 }),
  plugins: [react()],
  define: {
    "process.env.npm_package_version": JSON.stringify(packageJson.version),
  },
});
