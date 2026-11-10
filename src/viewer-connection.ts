export type ViewerConnectionStatus =
  | "loading"
  | "connected"
  | "disconnected"
  | "error";
export type ViewerConnectionEvent =
  | "socket-open"
  | "socket-close"
  | "api-error";

interface ViewerLocation {
  protocol: string;
  host: string;
}

/** A viewer URL names a layout by id; older sources named it by name. */
export interface ViewerLayoutRequest {
  id: string;
  builtin: boolean;
}

export function viewerLayoutRequestFromSearch(
  search: string,
): ViewerLayoutRequest | null {
  const params = new URLSearchParams(search);
  const id = params.get("layout")?.trim();
  if (!id) return null;
  return { id, builtin: params.get("builtin") === "true" };
}

/** "native" takes input from the server instead of the browser Gamepad API. */
export type ViewerInputMode = "browser" | "native";

export function viewerInputModeFromSearch(search: string): ViewerInputMode {
  return new URLSearchParams(search).get("input") === "native"
    ? "native"
    : "browser";
}

export function layoutForViewerState(
  current: Layout,
  incoming: Layout,
  fixedLayout: boolean,
): Layout {
  return fixedLayout ? current : incoming;
}

export function createViewerWebSocketUrl(
  location: ViewerLocation,
  inputMode: ViewerInputMode = "browser",
): string {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const query = inputMode === "native" ? "?input=native" : "";
  return `${protocol}://${location.host}/ws${query}`;
}

export function nextViewerConnectionStatus(
  current: ViewerConnectionStatus,
  event: ViewerConnectionEvent,
): ViewerConnectionStatus {
  if (event === "socket-open") return "connected";
  if (event === "socket-close") return "disconnected";
  return current === "connected" ? current : "error";
}

import type { Layout } from "./types";
