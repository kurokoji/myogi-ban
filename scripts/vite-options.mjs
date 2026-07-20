import { resolve } from "node:path";

export function createViteOptions({ backendPort }) {
  const backendUrl = `http://localhost:${backendPort}`;
  const proxy = (websocket = false) => ({
    target: backendUrl,
    ...(websocket ? { ws: true } : {}),
  });

  return {
    publicDir: false,
    build: {
      outDir: "public",
      emptyOutDir: false,
      rollupOptions: {
        input: {
          editor: resolve("index.html"),
          viewer: resolve("view.html"),
        },
      },
    },
    server: {
      proxy: {
        "/api": proxy(),
        "/favicon.png": proxy(),
        "/layout": proxy(),
        "/css": proxy(),
        "/ws": proxy(true),
      },
    },
  };
}
