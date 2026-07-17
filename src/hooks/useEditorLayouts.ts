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
import {
  cloneLayout,
  type EditorLayoutUpdater,
  type ImageUploadTarget,
  layoutNameFromSelection,
  layoutSelectionValue,
  readFileAsDataUrl,
} from "../editor-helpers";
import {
  type ButtonMapping,
  GamepadManager,
  type StickMapping,
} from "../gamepad";
import { ensureLayoutDefaults } from "../layout";
import { withUploadedImage } from "../layout-image";
import { isLayoutNameTaken } from "../layout-name";
import {
  buildLayoutForSave,
  createEditorSnapshotSignature,
} from "../layout-save";
import { selectLayoutAfterDelete } from "../layout-selection";
import type { Layout, LayoutEntry, OperationStatus } from "../types";

interface UseEditorLayoutsOptions {
  api: ApiClient;
  layout: Layout;
  buttonMappings: ButtonMapping[];
  stickMappings: StickMapping[];
  setButtonMappings: Dispatch<SetStateAction<ButtonMapping[]>>;
  setStickMappings: Dispatch<SetStateAction<StickMapping[]>>;
  setSelectedButtonIndexes: Dispatch<SetStateAction<number[]>>;
  setSelectedStick: Dispatch<SetStateAction<boolean>>;
  restoreLayout: (layout: Layout) => void;
  clearLayoutHistory: () => void;
  updateLayout: EditorLayoutUpdater;
  messages: {
    saved: string;
    defaultSaved: string;
    invalidLayoutFile: string;
    operationFailed: string;
    discardChanges: string;
    confirmDelete: string;
    deleted: string;
    layoutNameExists: string;
  };
}

export function useEditorLayouts(options: UseEditorLayoutsOptions) {
  const {
    api,
    layout,
    buttonMappings,
    stickMappings,
    setButtonMappings,
    setStickMappings,
    setSelectedButtonIndexes,
    setSelectedStick,
    restoreLayout,
    clearLayoutHistory,
    updateLayout,
    messages,
  } = options;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadTargetRef = useRef<ImageUploadTarget>({
    type: "background",
  });
  const [layoutNames, setLayoutNames] = useState<LayoutEntry[]>([]);
  const [selectedLayout, setSelectedLayout] = useState("");
  const [layoutName, setLayoutName] = useState("mypreset");
  const [currentBuiltin, setCurrentBuiltin] = useState(false);
  const [cleanSignature, setCleanSignature] = useState("");
  const [status, setStatus] = useState<OperationStatus>(null);

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
      setSelectedButtonIndexes([]);
      setSelectedStick(false);
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
      setSelectedButtonIndexes,
      setSelectedStick,
      setStickMappings,
    ],
  );

  useEffect(() => {
    let cancelled = false;
    const loadDefaultLayout = async () => {
      try {
        const defaultLayout = await api.getDefaultLayout();
        const name = defaultLayout.name || "preset";
        const entries = await refreshLayouts();
        if (!cancelled) {
          const entry =
            entries.find((item) => item.name === name && !item.builtin) ??
            entries.find((item) => item.name === name);
          const data = await api.getLayout(name, entry?.builtin ?? false);
          if (data) applyLayout(data, name, entry?.builtin ?? false);
          setSelectedLayout(
            entry ? layoutSelectionValue(entry.name, entry.builtin) : name,
          );
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

  const openLayout = async (selection: string) => {
    if (!selection || selection === selectedLayout) return;
    const dirty =
      cleanSignature !==
      createEditorSnapshotSignature(layout, buttonMappings, stickMappings);
    if (dirty && !window.confirm(messages.discardChanges)) return;
    const name = layoutNameFromSelection(selection);
    try {
      const entry = layoutNames.find(
        (item) => layoutSelectionValue(item.name, item.builtin) === selection,
      );
      applyLayout(
        await api.getLayout(name, entry?.builtin ?? false),
        name,
        entry?.builtin ?? false,
      );
      setSelectedLayout(selection);
    } catch (error) {
      console.error("Failed to load layout:", error);
      setStatus({ kind: "error", message: messages.operationFailed });
    }
  };

  const saveToName = async (name: string, overwrite = true) => {
    const data = buildLayoutForSave(
      layout,
      name,
      buttonMappings,
      stickMappings,
    );
    try {
      await api.saveLayout(name, data, overwrite);
      await refreshLayouts();
      restoreLayout(data);
      clearLayoutHistory();
      setLayoutName(name);
      setCurrentBuiltin(false);
      setSelectedLayout(layoutSelectionValue(name, false));
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
    return saveToName(trimmedName, false);
  };

  const setDefaultLayout = async () => {
    const name = layoutName || layout.name || "custom";
    try {
      await api.setDefaultLayout(name);
      setStatus({ kind: "success", message: messages.defaultSaved });
    } catch (error) {
      console.error("Failed to set default layout:", error);
      setStatus({ kind: "error", message: messages.operationFailed });
    }
  };

  const deleteLayout = async () => {
    if (currentBuiltin || !layoutName) return;
    if (!window.confirm(messages.confirmDelete.replace("{{name}}", layoutName)))
      return;
    try {
      const defaultLayout = await api.getDefaultLayout();
      await api.deleteLayout(layoutName);
      const entries = await refreshLayouts();
      const fallback = selectLayoutAfterDelete(entries, layoutName);
      if (fallback) {
        const selection = layoutSelectionValue(fallback.name, fallback.builtin);
        applyLayout(
          await api.getLayout(fallback.name, fallback.builtin),
          fallback.name,
          fallback.builtin,
        );
        setSelectedLayout(selection);
        if (defaultLayout.name === layoutName) {
          await api.setDefaultLayout(fallback.name);
        }
      } else {
        setSelectedLayout("");
      }
      setStatus({ kind: "success", message: messages.deleted });
    } catch (error) {
      console.error("Failed to delete layout:", error);
      setStatus({ kind: "error", message: messages.operationFailed });
    }
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
    const uploadLayoutName = layout.name || "custom";
    try {
      const result = await api.uploadImage({
        data: await readFileAsDataUrl(file),
        layoutName: uploadLayoutName,
        fileName: file.name,
      });
      const fileName = result.fileName || file.name;
      const target = imageUploadTargetRef.current;
      updateLayout((next) => {
        Object.assign(
          next,
          withUploadedImage(next, target, uploadLayoutName, fileName),
        );
      });
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  };

  const exportLayout = () => {
    const blob = new Blob([JSON.stringify(cloneLayout(layout), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${layoutName || "layout"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importLayout = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        applyLayout(data, data.name || "imported", false, false);
      } catch {
        setStatus({ kind: "error", message: messages.invalidLayoutFile });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return {
    currentBuiltin,
    deleteLayout,
    exportLayout,
    fileInputRef,
    importLayout,
    layoutName,
    layoutNames,
    openLayout,
    openImagePicker,
    saveLayout,
    saveLayoutAs,
    selectedLayout,
    setDefaultLayout,
    uploadImage,
    status,
    isDirty:
      cleanSignature !==
      createEditorSnapshotSignature(layout, buttonMappings, stickMappings),
  };
}
