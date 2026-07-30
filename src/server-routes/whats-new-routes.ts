import type { Express } from "express";
import { apiSuccess } from "../api-response";
import type { WhatsNewManager } from "../whats-new-manager";

export const WHATS_NEW_ROUTE_PATHS = [
  "/api/whats-new",
  "/api/whats-new/current",
] as const;

export function registerWhatsNewRoutes(
  app: Express,
  whatsNewManager: WhatsNewManager,
): void {
  app.get("/api/whats-new", async (_req, res) => {
    res.json(apiSuccess(await whatsNewManager.getStatus()));
  });

  app.get("/api/whats-new/current", async (_req, res) => {
    res.json(apiSuccess(await whatsNewManager.getCurrentReleaseNotes()));
  });
}
