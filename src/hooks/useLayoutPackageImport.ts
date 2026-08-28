import { useCallback, useRef, useState } from "react";
import { type ApiClient, ApiError } from "../api";
import { layoutSelectionValue } from "../editor-helpers";
import {
  InvalidLayoutPackageError,
  readLayoutPackage,
  summarizeLayoutPackage,
} from "../layout-package";
import { runSingleFlight } from "../single-flight";
import type { Layout, OperationStatus } from "../types";

interface LayoutPackageImportMessages {
  saved: string;
  invalidLayoutFile: string;
  layoutPackageImageInvalid: string;
  layoutPackageTooLarge: string;
  layoutPackageUnsafe: string;
}

interface UseLayoutPackageImportOptions {
  api: ApiClient;
  applyLayout: (
    data: Layout,
    name?: string,
    builtin?: boolean,
    markClean?: boolean,
  ) => void;
  refreshLayouts: () => Promise<unknown>;
  setSelectedLayout: (selection: string) => void;
  setStatus: (status: OperationStatus) => void;
  messages: LayoutPackageImportMessages;
}

export interface LayoutPackageImportPreview {
  name: string;
  savedName: string;
  formatVersion: number;
  imageCount: number;
  imageBytes: number;
}

export function layoutPackageErrorMessage(
  error: unknown,
  messages: LayoutPackageImportMessages,
): string {
  const code =
    error instanceof ApiError || error instanceof InvalidLayoutPackageError
      ? error.code
      : undefined;
  if (
    code === "package_too_large" ||
    code === "layout_too_large" ||
    code === "image_too_large"
  )
    return messages.layoutPackageTooLarge;
  if (code === "invalid_image_content")
    return messages.layoutPackageImageInvalid;
  if (
    code === "unsafe_path" ||
    code === "unexpected_file" ||
    code === "too_many_files"
  )
    return messages.layoutPackageUnsafe;
  return messages.invalidLayoutFile;
}

export function useLayoutPackageImport({
  api,
  applyLayout,
  refreshLayouts,
  setSelectedLayout,
  setStatus,
  messages,
}: UseLayoutPackageImportOptions) {
  const importInProgressRef = useRef(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    data: Uint8Array;
    preview: LayoutPackageImportPreview;
  } | null>(null);

  const inspectPackageFile = useCallback(
    async (file: File) => {
      try {
        const data = new Uint8Array(await file.arrayBuffer());
        const summary = summarizeLayoutPackage(await readLayoutPackage(data));
        setPendingImport({
          data,
          preview: { ...summary, savedName: summary.name },
        });
      } catch (error) {
        console.error("Failed to inspect layout package:", error);
        setStatus({
          kind: "error",
          message: layoutPackageErrorMessage(error, messages),
        });
      }
    },
    [messages, setStatus],
  );

  const confirmImport = useCallback(async () => {
    if (!pendingImport) return;
    await runSingleFlight(importInProgressRef, async () => {
      setImportInProgress(true);
      try {
        const result = await api.importLayoutPackage(pendingImport.data);
        setPendingImport(null);
        await refreshLayouts();
        applyLayout(result.layout, result.name, false);
        setSelectedLayout(layoutSelectionValue(result.layout.id, false));
        setStatus({ kind: "success", message: messages.saved });
      } catch (error) {
        console.error("Failed to import layout package:", error);
        setStatus({
          kind: "error",
          message: layoutPackageErrorMessage(error, messages),
        });
      } finally {
        setImportInProgress(false);
      }
    });
  }, [
    api,
    applyLayout,
    messages,
    pendingImport,
    refreshLayouts,
    setSelectedLayout,
    setStatus,
  ]);

  const cancelImport = useCallback(() => {
    if (!importInProgressRef.current) setPendingImport(null);
  }, []);

  return {
    pendingImport: pendingImport?.preview ?? null,
    importInProgress,
    inspectPackageFile,
    confirmImport,
    cancelImport,
  };
}
