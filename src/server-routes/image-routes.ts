import type { Express } from "express";
import { ImageUploadValidationError } from "../image-asset";
import type { LayoutRepository } from "../layout-repository";

export const IMAGE_ROUTE_PATHS = ["/api/upload-image"] as const;

export function registerImageRoutes(
  app: Express,
  layouts: LayoutRepository,
): void {
  app.post("/api/upload-image", (req, res) => {
    const { data, layoutName, fileName } = req.body;
    try {
      const safeFileName = layouts.uploadImage(
        data,
        layoutName || "custom",
        fileName,
      );
      res.json({ ok: true, fileName: safeFileName });
    } catch (error) {
      if (error instanceof ImageUploadValidationError) {
        res.status(400).json({ ok: false, error: error.code });
        return;
      }
      throw error;
    }
  });
}
