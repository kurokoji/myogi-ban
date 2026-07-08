import { createRequire } from "node:module";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

await build({
  entryPoints: ["src/editor.tsx"],
  bundle: true,
  minify: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env.npm_package_version": JSON.stringify(pkg.version),
  },
  outfile: "public/js/editor.js",
});
