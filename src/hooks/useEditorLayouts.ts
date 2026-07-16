import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ApiClient } from "../api";
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
import type { Layout, LayoutEntry } from "../types";

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
    (data: Layout, name?: string) => {
      restoreLayout(ensureLayoutDefaults(data));
      clearLayoutHistory();
      setSelectedButtonIndexes([]);
      setSelectedStick(false);
      setButtonMappings(
        data.buttonMappings || GamepadManager.createDefaultButtonMappings(),
      );
      setStickMappings(
        data.stickMappings || GamepadManager.createDefaultStickMappings(),
      );
      if (name) setLayoutName(name);
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
        const data = await api.getLayout(name);
        if (!cancelled && data) applyLayout(data, name);
        const entries = await refreshLayouts();
        if (!cancelled) {
          const entry = entries.find((item) => item.name === name);
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

  const loadLayout = async () => {
    if (!selectedLayout) return;
    const name = layoutNameFromSelection(selectedLayout);
    try {
      applyLayout(await api.getLayout(name), name);
    } catch (error) {
      console.error("Failed to load layout:", error);
    }
  };

  const saveLayout = async () => {
    const name = layoutName || layout.name || "custom";
    const data = cloneLayout(layout);
    data.name = name;
    data.buttonMappings = buttonMappings;
    data.stickMappings = stickMappings;
    try {
      await api.saveLayout(name, data);
      await refreshLayouts();
      window.alert(messages.saved);
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  };

  const setDefaultLayout = async () => {
    const name = layoutName || layout.name || "custom";
    try {
      await api.setDefaultLayout(name);
      window.alert(messages.defaultSaved);
    } catch (error) {
      console.error("Failed to set default layout:", error);
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
        next.name = uploadLayoutName;
        if (target.type === "background") {
          next.background.image = fileName;
        } else if (target.type === "defaultButton") {
          next.defaultbuttons[target.state === "pressed" ? "imgp" : "img"] =
            fileName;
        } else {
          next.buttons[target.index][
            target.state === "pressed" ? "imgp" : "img"
          ] = fileName;
        }
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
        applyLayout(data, data.name || "imported");
      } catch {
        window.alert(messages.invalidLayoutFile);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return {
    exportLayout,
    fileInputRef,
    importLayout,
    layoutName,
    layoutNames,
    loadLayout,
    openImagePicker,
    saveLayout,
    selectedLayout,
    setDefaultLayout,
    setLayoutName,
    setSelectedLayout,
    uploadImage,
  };
}
