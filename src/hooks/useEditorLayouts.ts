import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { type ApiClient, ApiError } from "../api";
import { selectDefaultLayoutEntry } from "../default-layout";
import {
  type EditorLayoutUpdater,
  type ImageUploadTarget,
  layoutNameFromSelection,
  layoutSelectionValue,
  readFileAsDataUrl,
} from "../editor-helpers";
import {
  type EditorSelection,
  EMPTY_EDITOR_SELECTION,
} from "../editor-selection";
import {
  type ButtonMapping,
  GamepadManager,
  type StickMapping,
} from "../gamepad";
import { ensureLayoutDefaults } from "../layout";
import { createLayoutId } from "../layout-id";
import { withUploadedImage } from "../layout-image";
import {
  isLayoutNameTaken,
  normalizeLayoutName,
  resolveAvailableLayoutName,
} from "../layout-name";
import {
  createLayoutPackage,
  InvalidLayoutPackageError,
  readLayoutPackage,
  summarizeLayoutPackage,
} from "../layout-package";
import {
  buildLayoutForSave,
  createEditorSnapshotSignature,
} from "../layout-save";
import { selectLayoutAfterDelete } from "../layout-selection";
import { parseImportedLayoutJson } from "../layout-validation";
import { runSingleFlight } from "../single-flight";
import type { Layout, LayoutEntry, OperationStatus } from "../types";

interface UseEditorLayoutsOptions {
  api: ApiClient;
  layout: Layout;
  buttonMappings: ButtonMapping[];
  stickMappings: StickMapping[];
  setButtonMappings: Dispatch<SetStateAction<ButtonMapping[]>>;
  setStickMappings: Dispatch<SetStateAction<StickMapping[]>>;
  setSelection: Dispatch<SetStateAction<EditorSelection>>;
  restoreLayout: (layout: Layout) => void;
  clearLayoutHistory: () => void;
  updateLayout: EditorLayoutUpdater;
  messages: {
    saved: string;
    defaultSaved: string;
    invalidLayoutFile: string;
    layoutPackageImageInvalid: string;
    layoutPackageTooLarge: string;
    layoutPackageUnsafe: string;
    operationFailed: string;
    discardChanges: string;
    discardAndOpen: string;
    discardAndImport: string;
    confirmDelete: string;
    deleteLayout: string;
    deleted: string;
    layoutNameExists: string;
    renamed: string;
  };
}

export interface PendingConfirmation {
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
}

export function useEditorLayouts(options: UseEditorLayoutsOptions) {
  const {
    api,
    layout,
    buttonMappings,
    stickMappings,
    setButtonMappings,
    setStickMappings,
    setSelection,
    restoreLayout,
    clearLayoutHistory,
    updateLayout,
    messages,
  } = options;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadTargetRef = useRef<ImageUploadTarget>({
    type: "background",
  });
  const importInProgressRef = useRef(false);
  const [layoutNames, setLayoutNames] = useState<LayoutEntry[]>([]);
  const [selectedLayout, setSelectedLayout] = useState("");
  const [layoutName, setLayoutName] = useState("mypreset");
  const [currentBuiltin, setCurrentBuiltin] = useState(false);
  // The name is what the user reads; the id is what the server is keyed on.
  const layoutId = layout.id || layoutName;
  const [defaultLayoutId, setDefaultLayoutId] = useState("");
  const [cleanSignature, setCleanSignature] = useState("");
  const [status, setStatus] = useState<OperationStatus>(null);
  const [importInProgress, setImportInProgress] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);
  const [pendingLayoutImport, setPendingLayoutImport] = useState<{
    data: Uint8Array;
    preview: {
      name: string;
      savedName: string;
      formatVersion: number;
      imageCount: number;
      imageBytes: number;
    };
  } | null>(null);

  const layoutPackageErrorMessage = (error: unknown): string => {
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
  };

  const refreshLayouts = useCallback(async () => {
    try {
      const layouts = await api.getLayouts();
      setLayoutNames(layouts);
      return layouts;
    } catch (error) {
      console.error("Failed to load layout list:", error);
      return [];
    }
  }, [api]);

  const applyLayout = useCallback(
    (data: Layout, name?: string, builtin = false, markClean = true) => {
      const nextLayout = ensureLayoutDefaults(data);
      const nextButtonMappings =
        data.buttonMappings || GamepadManager.createDefaultButtonMappings();
      const nextStickMappings =
        data.stickMappings || GamepadManager.createDefaultStickMappings();
      restoreLayout(nextLayout);
      clearLayoutHistory();
      setSelection(EMPTY_EDITOR_SELECTION);
      setButtonMappings(nextButtonMappings);
      setStickMappings(nextStickMappings);
      if (name) setLayoutName(name);
      setCurrentBuiltin(builtin);
      setStatus(null);
      setCleanSignature(
        markClean
          ? createEditorSnapshotSignature(
              nextLayout,
              nextButtonMappings,
              nextStickMappings,
            )
          : "",
      );
    },
    [
      clearLayoutHistory,
      restoreLayout,
      setButtonMappings,
      setSelection,
      setStickMappings,
    ],
  );

  useEffect(() => {
    let cancelled = false;
    const loadDefaultLayout = async () => {
      try {
        const defaultLayout = await api.getDefaultLayout();
        const id = defaultLayout.id || "preset";
        const entries = await refreshLayouts();
        if (!cancelled) {
          setDefaultLayoutId(id);
          const entry = selectDefaultLayoutEntry(entries, id);
          if (!entry) return;
          const data = await api.getLayout(entry.id, entry.builtin);
          if (data) applyLayout(data, entry.name, entry.builtin);
          setSelectedLayout(layoutSelectionValue(entry.id, entry.builtin));
        }
      } catch {
        console.log("No default layout found, using built-in default");
        await refreshLayouts();
      }
    };
    loadDefaultLayout();
    return () => {
      cancelled = true;
    };
  }, [api, applyLayout, refreshLayouts]);

  const performOpenLayout = async (selection: string) => {
    const id = layoutNameFromSelection(selection);
    try {
      const entry = layoutNames.find(
        (item) => layoutSelectionValue(item.id, item.builtin) === selection,
      );
      applyLayout(
        await api.getLayout(id, entry?.builtin ?? false),
        entry?.name ?? id,
        entry?.builtin ?? false,
      );
      setSelectedLayout(selection);
    } catch (error) {
      console.error("Failed to load layout:", error);
      setStatus({ kind: "error", message: messages.operationFailed });
    }
  };

  const openLayout = (selection: string) => {
    if (!selection || selection === selectedLayout) return;
    const hasUnsavedChanges =
      cleanSignature !==
      createEditorSnapshotSignature(layout, buttonMappings, stickMappings);
    if (!hasUnsavedChanges) {
      void performOpenLayout(selection);
      return;
    }
    setPendingConfirmation({
      message: messages.discardChanges,
      confirmLabel: messages.discardAndOpen,
      onConfirm: () => performOpenLayout(selection),
    });
  };

  const saveToName = async (name: string, overwrite = true, id = layoutId) => {
    const data = buildLayoutForSave(
      layout,
      name,
      buttonMappings,
      stickMappings,
      id,
    );
    try {
      await api.saveLayout(id, data, overwrite);
      await refreshLayouts();
      restoreLayout(data);
      setLayoutName(name);
      setCurrentBuiltin(false);
      setSelectedLayout(layoutSelectionValue(id, false));
      setCleanSignature(
        createEditorSnapshotSignature(data, buttonMappings, stickMappings),
      );
      setStatus({ kind: "success", message: messages.saved });
      return true;
    } catch (error) {
      console.error("Failed to save layout:", error);
      setStatus({
        kind: "error",
        message:
          error instanceof ApiError && error.status === 409
            ? messages.layoutNameExists
            : messages.operationFailed,
      });
      return false;
    }
  };

  const saveLayout = async () => {
    if (currentBuiltin) return;
    await saveToName(layoutName || layout.name || "custom");
  };

  const saveLayoutAs = async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    if (isLayoutNameTaken(trimmedName, layoutNames)) {
      setStatus({ kind: "error", message: messages.layoutNameExists });
      return false;
    }
    // Saving under a new name creates a layout, which gets its own id.
    return saveToName(trimmedName, false, createLayoutId());
  };

  const renameLayout = async (name: string) => {
    if (currentBuiltin || !layoutName) return false;
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    const isSameName =
      normalizeLayoutName(trimmedName) === normalizeLayoutName(layoutName);
    if (!isSameName && isLayoutNameTaken(trimmedName, layoutNames)) {
      setStatus({ kind: "error", message: messages.layoutNameExists });
      return false;
    }
    if (isSameName) return true;

    const wasClean =
      cleanSignature ===
      createEditorSnapshotSignature(layout, buttonMappings, stickMappings);
    try {
      await api.renameLayout(layoutId, trimmedName);
      const wasDefault = defaultLayoutId === layoutId;
      await refreshLayouts();
      const renamed = { ...layout, name: trimmedName, id: trimmedName };
      restoreLayout(renamed);
      setLayoutName(trimmedName);
      setSelectedLayout(layoutSelectionValue(trimmedName, false));
      if (wasClean) {
        setCleanSignature(
          createEditorSnapshotSignature(renamed, buttonMappings, stickMappings),
        );
      }
      if (wasDefault) setDefaultLayoutId(trimmedName);
      setStatus({ kind: "success", message: messages.renamed });
      return true;
    } catch (error) {
      console.error("Failed to rename layout:", error);
      setStatus({
        kind: "error",
        message:
          error instanceof ApiError && error.status === 409
            ? messages.layoutNameExists
            : messages.operationFailed,
      });
      return false;
    }
  };

  const setDefaultLayout = async () => {
    const id = layoutId;
    try {
      await api.setDefaultLayout(id);
      setDefaultLayoutId(id);
      setStatus({ kind: "success", message: messages.defaultSaved });
    } catch (error) {
      console.error("Failed to set default layout:", error);
      setStatus({ kind: "error", message: messages.operationFailed });
    }
  };

  const performDeleteLayout = async () => {
    try {
      const defaultLayout = await api.getDefaultLayout();
      await api.deleteLayout(layoutId);
      const entries = await refreshLayouts();
      const fallback = selectLayoutAfterDelete(entries, layoutId);
      if (fallback) {
        const selection = layoutSelectionValue(fallback.id, fallback.builtin);
        applyLayout(
          await api.getLayout(fallback.id, fallback.builtin),
          fallback.name,
          fallback.builtin,
        );
        setSelectedLayout(selection);
        if (defaultLayout.id === layoutId) {
          await api.setDefaultLayout(fallback.id);
          setDefaultLayoutId(fallback.id);
        }
      } else {
        setSelectedLayout("");
        if (defaultLayout.id === layoutId) setDefaultLayoutId("");
      }
      setStatus({ kind: "success", message: messages.deleted });
    } catch (error) {
      console.error("Failed to delete layout:", error);
      setStatus({ kind: "error", message: messages.operationFailed });
    }
  };

  const deleteLayout = () => {
    if (currentBuiltin || !layoutName) return;
    setPendingConfirmation({
      message: messages.confirmDelete.replace("{{name}}", layoutName),
      confirmLabel: messages.deleteLayout,
      onConfirm: performDeleteLayout,
    });
  };

  const openImagePicker = (target: ImageUploadTarget) => {
    imageUploadTargetRef.current = target;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploadLayoutId = layout.id || layout.name || "custom";
    try {
      const result = await api.uploadImage({
        data: await readFileAsDataUrl(file),
        layoutId: uploadLayoutId,
        fileName: file.name,
      });
      const fileName = result.fileName || file.name;
      const target = imageUploadTargetRef.current;
      updateLayout((next) => {
        Object.assign(
          next,
          withUploadedImage(next, target, uploadLayoutId, fileName),
        );
      });
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  };

  const exportLayout = async () => {
    try {
      const archive = await createLayoutPackage(layout, async (name) => {
        const response = await fetch(
          `/layout/${encodeURIComponent(layout.name)}/${encodeURIComponent(name)}`,
        );
        return response.ok
          ? new Uint8Array(await response.arrayBuffer())
          : undefined;
      });
      const blob = new Blob([new Uint8Array(archive).buffer], {
        type: "application/zip",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${layoutName || "layout"}.myogi`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export layout:", error);
      setStatus({ kind: "error", message: messages.operationFailed });
    }
  };

  const importLayout = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (file.name.toLowerCase().endsWith(".myogi")) {
      try {
        const data = new Uint8Array(await file.arrayBuffer());
        const summary = summarizeLayoutPackage(await readLayoutPackage(data));
        setPendingLayoutImport({
          data,
          preview: {
            ...summary,
            savedName: resolveAvailableLayoutName(summary.name, layoutNames),
          },
        });
      } catch (error) {
        console.error("Failed to inspect layout package:", error);
        setStatus({ kind: "error", message: layoutPackageErrorMessage(error) });
      }
      return;
    }
    const hasUnsavedChanges =
      cleanSignature !==
      createEditorSnapshotSignature(layout, buttonMappings, stickMappings);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseImportedLayoutJson(String(reader.result));
        const apply = () =>
          applyLayout(data as Layout, data.name || "imported", false, false);
        if (hasUnsavedChanges) {
          setPendingConfirmation({
            message: messages.discardChanges,
            confirmLabel: messages.discardAndImport,
            onConfirm: apply,
          });
        } else {
          apply();
        }
      } catch {
        setStatus({ kind: "error", message: messages.invalidLayoutFile });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!pendingLayoutImport) return;
    await runSingleFlight(importInProgressRef, async () => {
      setImportInProgress(true);
      try {
        const result = await api.importLayoutPackage(pendingLayoutImport.data);
        setPendingLayoutImport(null);
        await refreshLayouts();
        applyLayout(result.layout, result.name, false);
        setSelectedLayout(layoutSelectionValue(result.name, false));
        setStatus({ kind: "success", message: messages.saved });
      } catch (error) {
        console.error("Failed to import layout package:", error);
        setStatus({ kind: "error", message: layoutPackageErrorMessage(error) });
      } finally {
        setImportInProgress(false);
      }
    });
  };

  const cancelImport = () => {
    if (!importInProgressRef.current) setPendingLayoutImport(null);
  };

  const confirmPendingAction = async () => {
    const pending = pendingConfirmation;
    setPendingConfirmation(null);
    if (pending) await pending.onConfirm();
  };

  const cancelPendingAction = () => {
    setPendingConfirmation(null);
  };

  return {
    currentBuiltin,
    cancelImport,
    cancelPendingAction,
    confirmImport,
    confirmPendingAction,
    deleteLayout,
    exportLayout,
    fileInputRef,
    importLayout,
    importInProgress,
    pendingConfirmation,
    layoutName,
    layoutNames,
    openLayout,
    openImagePicker,
    pendingImport: pendingLayoutImport?.preview ?? null,
    renameLayout,
    saveLayout,
    saveLayoutAs,
    selectedLayout,
    setDefaultLayout,
    uploadImage,
    status,
    isDirty:
      cleanSignature !==
      createEditorSnapshotSignature(layout, buttonMappings, stickMappings),
    isDefaultLayout: defaultLayoutId !== "" && defaultLayoutId === layoutId,
  };
}
