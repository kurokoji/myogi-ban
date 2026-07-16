import {
  type GamepadState,
  type Layout,
  type LayoutEntry,
  SERVER_URL,
} from "./types";

interface UploadImageOptions {
  data: string;
  layoutName: string;
  fileName: string;
}

interface UploadImageResult {
  fileName: string;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${SERVER_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(
      `API request failed: ${init?.method ?? "GET"} ${path} (${response.status})`,
    );
  }
  return response;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await request(path, init);
  return response.json() as Promise<T>;
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
}
