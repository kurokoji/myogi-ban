import express, { type Express } from "express";
import { apiFailure, apiSuccess } from "../api-response";
import { InvalidLayoutPackageError } from "../layout-package";
import {
  CorruptLayoutError,
  type LayoutRepository,
} from "../layout-repository";
import type { Layout } from "../types";

export const LAYOUT_ROUTE_PATHS = [
  "/api/layouts",
  "/api/layouts/:name",
  "/api/layout-imports",
  "/api/default-layout",
] as const;

export function registerLayoutRoutes(
  app: Express,
  layouts: LayoutRepository,
): void {
  app.put("/api/layouts/:name", (req, res) => {
    const name = req.params.name;
    if (req.body.overwrite === false && layouts.has(name)) {
      res.status(409).json(apiFailure("layout_name_exists"));
      return;
    }
    layouts.save(name, req.body.data as Layout);
    res.json(apiSuccess());
  });
  app.post(
    "/api/layout-imports",
    express.raw({ type: "application/octet-stream", limit: "100mb" }),
    async (req, res) => {
      try {
        const result = await layouts.importPackage(
          new Uint8Array(req.body as Buffer),
        );
        res.json(apiSuccess(result));
      } catch (error) {
        console.error("Failed to import layout package:", error);
        res
          .status(400)
          .json(
            apiFailure(
              error instanceof InvalidLayoutPackageError
                ? error.code
                : "invalid_layout_package",
            ),
          );
      }
    },
  );
  app.get("/api/layouts", (_req, res) => res.json(apiSuccess(layouts.list())));
  app.get("/api/layouts/:name", (req, res) => {
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
  app.delete("/api/layouts/:name", (req, res) => {
    if (!layouts.delete(req.params.name)) {
      res.status(404).json(apiFailure("layout_not_found"));
      return;
    }
    res.json(apiSuccess());
  });
  app.get("/api/default-layout", (_req, res) =>
    res.json(apiSuccess(layouts.getDefault())),
  );
  app.put("/api/default-layout", (req, res) => {
    layouts.setDefault(req.body.name);
    res.json(apiSuccess());
  });
}
