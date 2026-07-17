export type ViewerConnectionStatus =
  | "loading"
  | "connected"
  | "disconnected"
  | "error";
export type ViewerConnectionEvent =
  | "socket-open"
  | "socket-close"
  | "api-error";

export function nextViewerConnectionStatus(
  current: ViewerConnectionStatus,
  event: ViewerConnectionEvent,
): ViewerConnectionStatus {
  if (event === "socket-open") return "connected";
  if (event === "socket-close") return "disconnected";
  return current === "connected" ? current : "error";
}
