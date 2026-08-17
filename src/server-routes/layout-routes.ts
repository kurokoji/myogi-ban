import express, { type Express } from "express";
import { apiFailure, apiSuccess } from "../api-response";
import { resolveLayoutDimensions } from "../layout-dimensions";
import { normalizeLayoutName } from "../layout-name";
import { InvalidLayoutPackageError } from "../layout-package";
import {
  CorruptLayoutError,
  type LayoutRepository,
} from "../layout-repository";
import type { Layout } from "../types";

export const LAYOUT_ROUTE_PATHS = [
  "/api/layouts",
  "/api/layouts/:id",
  "/api/layouts/:id/rename",
  "/api/layouts/:id/dimensions",
  "/api/layout-imports",
  "/api/default-layout",
  "/api/default-layout/dimensions",
] as const;

export function registerLayoutRoutes(
  app: Express,
  layouts: LayoutRepository,
): void {
  app.put("/api/layouts/:id", (req, res) => {
    const name = req.params.id;
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
  app.get("/api/layouts/:id/dimensions", (req, res) =>
    res.json(
      apiSuccess(
        resolveLayoutDimensions(
          layouts.read(req.params.id, req.query.builtin === "true"),
        ),
      ),
    ),
  );
  app.get("/api/layouts/:id", (req, res) => {
    try {
      res.json(
        apiSuccess(layouts.read(req.params.id, req.query.builtin === "true")),
      );
    } catch (error) {
      if (error instanceof CorruptLayoutError) {
        res.status(422).json(apiFailure("invalid_layout_json"));
        return;
      }
      throw error;
    }
  });
  app.post("/api/layouts/:id/rename", (req, res) => {
    const oldName = req.params.id;
    const newName = req.body.newName as string;
    if (
      normalizeLayoutName(newName) !== normalizeLayoutName(oldName) &&
      layouts.has(newName)
    ) {
      res.status(409).json(apiFailure("layout_name_exists"));
      return;
    }
    if (!layouts.rename(oldName, newName)) {
      res.status(404).json(apiFailure("layout_not_found"));
      return;
    }
    res.json(apiSuccess());
  });
  app.delete("/api/layouts/:id", (req, res) => {
    if (!layouts.delete(req.params.id)) {
      res.status(404).json(apiFailure("layout_not_found"));
      return;
    }
    res.json(apiSuccess());
  });
  app.get("/api/default-layout", (_req, res) =>
    res.json(apiSuccess(layouts.getDefault())),
  );
  app.get("/api/default-layout/dimensions", (_req, res) =>
    res.json(apiSuccess(resolveLayoutDimensions(layouts.readDefault()))),
  );
  app.put("/api/default-layout", (req, res) => {
    layouts.setDefault(req.body.id ?? req.body.name);
    res.json(apiSuccess());
  });
}
