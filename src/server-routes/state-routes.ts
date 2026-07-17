import type { Express } from "express";
import { apiSuccess } from "../api-response";
import type { GamepadState } from "../types";

export const STATE_ROUTE_PATHS = ["/api/state"] as const;
export interface StateStore {
  latest: GamepadState | null;
}

export function registerStateRoutes(
  app: Express,
  store: StateStore,
  broadcast: (state: GamepadState) => void,
): void {
  app.post("/api/state", (req, res) => {
    store.latest = req.body as GamepadState;
    broadcast(store.latest);
    res.json(apiSuccess());
  });
  app.get("/api/state", (_req, res) =>
    res.json(apiSuccess(store.latest || {})),
  );
}
