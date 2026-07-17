import type { Express } from "express";
import { apiFailure, apiSuccess } from "../api-response";
import {
  CorruptLayoutError,
  type LayoutRepository,
} from "../layout-repository";
import type { Layout } from "../types";

export const LAYOUT_ROUTE_PATHS = [
  "/api/layout/save",
  "/api/layouts",
  "/api/layout/:name",
  "/api/default-layout",
] as const;

export function registerLayoutRoutes(
  app: Express,
  layouts: LayoutRepository,
): void {
  app.post("/api/layout/save", (req, res) => {
    const name = req.body.name || "custom";
    if (req.body.overwrite === false && layouts.has(name)) {
      res.status(409).json(apiFailure("layout_name_exists"));
      return;
    }
    layouts.save(name, req.body.data as Layout);
    res.json(apiSuccess());
  });
  app.get("/api/layouts", (_req, res) => res.json(apiSuccess(layouts.list())));
  app.get("/api/layout/:name", (req, res) => {
    try {
      res.json(
        apiSuccess(layouts.read(req.params.name, req.query.builtin === "true")),
      );
    } catch (error) {
      if (error instanceof CorruptLayoutError) {
        res.status(422).json(apiFailure("invalid_layout_json"));
        return;
      }
      throw error;
    }
  });
  app.delete("/api/layout/:name", (req, res) => {
    if (!layouts.delete(req.params.name)) {
      res.status(404).json(apiFailure("layout_not_found"));
      return;
    }
    res.json(apiSuccess());
  });
  app.get("/api/default-layout", (_req, res) =>
    res.json(apiSuccess(layouts.getDefault())),
  );
  app.post("/api/default-layout", (req, res) => {
    layouts.setDefault(req.body.name);
    res.json(apiSuccess());
  });
}
