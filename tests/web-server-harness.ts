import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocalServer } from "../src/local-server";
import type { Layout } from "../src/types";

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface TestWebServer {
  webSocketUrl: string;
  getJson<T>(path: string): Promise<T>;
  getText(path: string): Promise<string>;
  postJson(path: string, body: unknown): Promise<void>;
  close(): Promise<void>;
}

export async function startTestWebServer(
  builtins: Record<string, Layout>,
): Promise<TestWebServer> {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-web-e2e-"));
  const publicDir = join(root, "public");
  const builtinLayoutDir = join(root, "builtin-layouts");
  const userLayoutDir = join(root, "user-layouts");
  mkdirSync(publicDir, { recursive: true });
  mkdirSync(userLayoutDir, { recursive: true });
  writeFileSync(
    join(publicDir, "view.html"),
    "<!doctype html><title>Viewer</title>",
  );
  for (const [name, layout] of Object.entries(builtins)) {
    const layoutDir = join(builtinLayoutDir, name);
    mkdirSync(layoutDir, { recursive: true });
    writeFileSync(join(layoutDir, "layout.json"), JSON.stringify(layout));
  }

  const server = await new Promise<ReturnType<typeof createLocalServer>>(
    (resolve) => {
      const instance = createLocalServer({
        port: 0,
        publicDir,
        builtinLayoutDir,
        userLayoutDir,
        defaultLayoutFile: join(root, "default-layout.json"),
        onListening: () => resolve(instance),
      });
    },
  );
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  const successfulResponse = async (path: string, init?: RequestInit) => {
    const response = await fetch(`${baseUrl}${path}`, init);
    assertSuccessful(response, path);
    return response;
  };

  return {
    webSocketUrl: `ws://127.0.0.1:${port}`,
    async getJson<T>(path) {
      const response = await successfulResponse(path);
      return ((await response.json()) as ApiSuccess<T>).data;
    },
    async getText(path) {
      return (await successfulResponse(path)).text();
    },
    async postJson(path, body) {
      await successfulResponse(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function assertSuccessful(response: Response, path: string): void {
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
}
