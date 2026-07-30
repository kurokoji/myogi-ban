import type { Express } from "express";
import { apiFailure, apiSuccess } from "../api-response";
import {
  InstallerNotReadyError,
  type UpdateManager,
  UpdateNotSupportedError,
} from "../update-manager";

export const UPDATE_ROUTE_PATHS = [
  "/api/update/status",
  "/api/update/check",
  "/api/update/download",
  "/api/update/install",
  "/api/update/obs-plugin/download",
  "/api/update/obs-plugin/install",
] as const;

export function registerUpdateRoutes(
  app: Express,
  updateManager: UpdateManager,
): void {
  app.get("/api/update/status", async (_req, res) => {
    res.json(apiSuccess(await updateManager.getStatus()));
  });

  app.post("/api/update/check", async (_req, res) => {
    res.json(apiSuccess(await updateManager.checkNow()));
  });

  app.post("/api/update/download", async (_req, res) => {
    const status = await updateManager.getStatus();
    if (!status.installSupported) {
      res.status(400).json(apiFailure("update_not_supported"));
      return;
    }
    if (!status.updateAvailable) {
      res.status(400).json(apiFailure("no_update_available"));
      return;
    }
    void updateManager.startDownload();
    res.json(apiSuccess());
  });

  app.post("/api/update/install", (_req, res) => {
    try {
      updateManager.install();
      res.json(apiSuccess());
    } catch (error) {
      if (error instanceof UpdateNotSupportedError) {
        res.status(400).json(apiFailure("update_not_supported"));
        return;
      }
      if (error instanceof InstallerNotReadyError) {
        res.status(400).json(apiFailure("installer_not_ready"));
        return;
      }
      throw error;
    }
  });

  app.post("/api/update/obs-plugin/download", async (_req, res) => {
    const status = await updateManager.getStatus();
    if (!status.installSupported) {
      res.status(400).json(apiFailure("update_not_supported"));
      return;
    }
    if (!status.obsPluginAvailable) {
      res.status(400).json(apiFailure("obs_plugin_not_available"));
      return;
    }
    void updateManager.startObsPluginDownload();
    res.json(apiSuccess());
  });

  app.post("/api/update/obs-plugin/install", (_req, res) => {
    try {
      updateManager.installObsPlugin();
      res.json(apiSuccess());
    } catch (error) {
      if (error instanceof UpdateNotSupportedError) {
        res.status(400).json(apiFailure("update_not_supported"));
        return;
      }
      if (error instanceof InstallerNotReadyError) {
        res.status(400).json(apiFailure("installer_not_ready"));
        return;
      }
      throw error;
    }
  });
}
