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
