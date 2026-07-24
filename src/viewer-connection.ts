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

export interface ViewerLayoutRequest {
  name: string;
  builtin: boolean;
}

export function viewerLayoutRequestFromSearch(
  search: string,
): ViewerLayoutRequest | null {
  const params = new URLSearchParams(search);
  const name = params.get("layout")?.trim();
  if (!name) return null;
  return { name, builtin: params.get("builtin") === "true" };
}

export function layoutForViewerState(
  current: Layout,
  incoming: Layout,
  fixedLayout: boolean,
): Layout {
  return fixedLayout ? current : incoming;
}

export function createViewerWebSocketUrl(location: ViewerLocation): string {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${location.host}/ws`;
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
