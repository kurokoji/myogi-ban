import type { ApiFailure, ApiSuccess } from "./api-response";
import type { GamepadState, Layout, LayoutEntry } from "./types";

interface UploadImageOptions {
  data: string;
  layoutName: string;
  fileName: string;
}

interface UploadImageResult {
  fileName: string;
}

export interface ImportLayoutPackageResult {
  name: string;
  layout: Layout;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly method: string,
    readonly path: string,
    readonly code?: string,
  ) {
    super(`API request failed: ${method} ${path} (${status})`);
    this.name = "ApiError";
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(path, init);
  if (!response.ok) {
    let code: string | undefined;
    try {
      code = ((await response.json()) as ApiFailure).error;
    } catch {
      // A non-JSON failure has no application error code.
    }
    throw new ApiError(response.status, init?.method ?? "GET", path, code);
  }
  return response;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await request(path, init);
  const body = (await response.json()) as ApiSuccess<T>;
  return body.data;
}

function jsonRequest(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export class ApiClient {
  async getLayouts(): Promise<LayoutEntry[]> {
    return requestJson<LayoutEntry[]>("/api/layouts");
  }

  async getLayout(name: string, builtin = false): Promise<Layout> {
    const query = builtin ? "?builtin=true" : "";
    return requestJson<Layout>(
      `/api/layout/${encodeURIComponent(name)}${query}`,
    );
  }

  async saveLayout(
    name: string,
    data: Layout,
    overwrite = true,
  ): Promise<void> {
    await request("/api/layout/save", jsonRequest({ name, data, overwrite }));
  }

  async deleteLayout(name: string): Promise<void> {
    await request(`/api/layout/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  }

  async sendState(state: GamepadState): Promise<void> {
    try {
      await request("/api/state", jsonRequest(state));
    } catch {
      // ignore errors
    }
  }

  async getDefaultLayout(): Promise<{ name: string }> {
    return requestJson<{ name: string }>("/api/default-layout");
  }

  async setDefaultLayout(name: string): Promise<void> {
    await request("/api/default-layout", jsonRequest({ name }));
  }

  async uploadImage(options: UploadImageOptions): Promise<UploadImageResult> {
    return requestJson<UploadImageResult>(
      "/api/upload-image",
      jsonRequest(options),
    );
  }

  async importLayoutPackage(
    data: Uint8Array,
  ): Promise<ImportLayoutPackageResult> {
    return requestJson<ImportLayoutPackageResult>(
      "/api/layout/import-package",
      {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: new Uint8Array(data).buffer,
      },
    );
  }
}
