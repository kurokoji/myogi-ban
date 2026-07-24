import type { Express } from "express";
import { apiSuccess } from "../api-response";

export const WINDOW_ROUTE_PATHS = ["/api/window/show"] as const;

export function registerWindowRoutes(
  app: Express,
  showWindow: () => void,
): void {
  app.post("/api/window/show", (_req, res) => {
    showWindow();
    res.json(apiSuccess());
  });
}
