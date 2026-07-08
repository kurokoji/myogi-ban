import {
  ActionIcon,
  MantineProvider,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import type React from "react";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import "./i18n";
import { ApiClient } from "./api";
import {
  BackgroundSettingsPanel,
  ButtonSettingsPanel,
  DisplaySettingsPanel,
  GamepadStatusPanel,
  LayoutSettingsPanel,
  StickSettingsPanel,
} from "./components/editor/SettingsPanels";
import { GamepadView } from "./components/GamepadView";
import {
  cloneLayout,
  createEmptyButtonLayout,
  type ImageUploadTarget,
  layoutNameFromSelection,
  layoutSelectionValue,
  readFileAsDataUrl,
} from "./editor-helpers";
import {
  type ButtonMapping,
  GamepadManager,
  type StickMapping,
} from "./gamepad";
import { useEditorGamepad } from "./hooks/useEditorGamepad";
import i18n from "./i18n";
import { createDefaultLayout, ensureLayoutDefaults } from "./layout";
import { type Layout, type LayoutEntry, SERVER_URL } from "./types";

const MIN_PREVIEW_SCALE = 0.1;
const MAX_PREVIEW_SCALE = 3;
const PREVIEW_SCALE_STEP = 0.1;
const MAX_LAYOUT_HISTORY = 100;
const APP_VERSION = process.env.npm_package_version ?? "0.0.0";

function clampPreviewScale(scale: number): number {
  const nextScale = Math.min(
    MAX_PREVIEW_SCALE,
    Math.max(MIN_PREVIEW_SCALE, scale),
  );
  return Math.round(nextScale * 10) / 10;
}

function layoutSizeValue(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sameLayout(a: Layout, b: Layout): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

function EditorApp(): React.ReactElement {
  const { t } = useTranslation();
  const apiRef = useRef(new ApiClient());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadTargetRef = useRef<ImageUploadTarget>({
    type: "background",
  });
  const [layout, setLayout] = useState<Layout>(() => createDefaultLayout());
  const [layoutNames, setLayoutNames] = useState<LayoutEntry[]>([]);
  const [selectedLayout, setSelectedLayout] = useState("");
  const [layoutName, setLayoutName] = useState("mypreset");
  const [buttonMappings, setButtonMappings] = useState<ButtonMapping[]>(() =>
    GamepadManager.createDefaultButtonMappings(),
  );
  const [stickMappings, setStickMappings] = useState<StickMapping[]>(() =>
    GamepadManager.createDefaultStickMappings(),
  );
  const [previewScale, setPreviewScale] = useState(1);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(
    null,
  );
  const [selectedButtonIndexes, setSelectedButtonIndexes] = useState<number[]>(
    [],
  );
  const [selectedStick, setSelectedStick] = useState(false);
  const [language, setLanguage] = useState(i18n.language);
  const [historyAvailability, setHistoryAvailability] = useState({
    canUndo: false,
    canRedo: false,
  });
  const [copiedObsUrl, setCopiedObsUrl] = useState(false);
  const layoutRef = useRef(layout);
  const undoStackRef = useRef<Layout[]>([]);
  const redoStackRef = useRef<Layout[]>([]);
  const dragHistoryStartRef = useRef<Layout | null>(null);
  const {
    assigningTarget,
    assignmentName,
    cancelAssignment,
    connected,
    gamepadName,
    resetSnapshot,
    snapshot,
    startAssignment,
  } = useEditorGamepad({
    api: apiRef.current,
    layout,
    buttonMappings,
    stickMappings,
    setButtonMappings,
    setStickMappings,
    buttonLabel: t("buttonLabel"),
    stickLabel: t("stickLabel"),
  });

  const obsUrl = `${SERVER_URL}/view`;
  const zoomPercent = Math.round(previewScale * 100);
  const previewWidth = layoutSizeValue(layout.background.w, 500);
  const previewHeight = layoutSizeValue(layout.background.h, 250);
  const scaledPreviewWidth = Math.ceil(previewWidth * previewScale);
  const scaledPreviewHeight = Math.ceil(previewHeight * previewScale);

  const changePreviewScale = useCallback((scale: number) => {
    setPreviewScale(clampPreviewScale(scale));
  }, []);

  const zoomPreview = useCallback((delta: number) => {
    setPreviewScale((current) => clampPreviewScale(current + delta));
  }, []);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const syncLayoutHistoryAvailability = useCallback(() => {
    setHistoryAvailability({
      canUndo: undoStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
    });
  }, []);

  const clearLayoutHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    dragHistoryStartRef.current = null;
    syncLayoutHistoryAvailability();
  }, [syncLayoutHistoryAvailability]);

  const pushUndoSnapshot = useCallback(
    (snapshot: Layout) => {
      const nextStack = [...undoStackRef.current, cloneLayout(snapshot)];
      if (nextStack.length > MAX_LAYOUT_HISTORY) {
        nextStack.shift();
      }
      undoStackRef.current = nextStack;
      syncLayoutHistoryAvailability();
    },
    [syncLayoutHistoryAvailability],
  );

  const restoreLayout = useCallback(
    (nextLayout: Layout) => {
      layoutRef.current = nextLayout;
      setLayout(nextLayout);
      resetSnapshot(nextLayout);
    },
    [resetSnapshot],
  );

  const undoLayout = useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;

    const current = cloneLayout(layoutRef.current);
    redoStackRef.current = [...redoStackRef.current, current];
    restoreLayout(previous);
    syncLayoutHistoryAvailability();
  }, [restoreLayout, syncLayoutHistoryAvailability]);

  const redoLayout = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;

    const current = cloneLayout(layoutRef.current);
    pushUndoSnapshot(current);
    restoreLayout(next);
    syncLayoutHistoryAvailability();
  }, [pushUndoSnapshot, restoreLayout, syncLayoutHistoryAvailability]);

  const refreshLayouts = useCallback(async () => {
    try {
      const layouts = await apiRef.current.getLayouts();
      setLayoutNames(layouts);
      return layouts;
    } catch (error) {
      console.error("Failed to load layout list:", error);
      return [];
    }
  }, []);

  const applyLayout = useCallback(
    (data: Layout, name?: string) => {
      const nextLayout = ensureLayoutDefaults(data);
      layoutRef.current = nextLayout;
      setLayout(nextLayout);
      resetSnapshot(nextLayout);
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
    [clearLayoutHistory, resetSnapshot],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (!event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key.toLowerCase() !== "z") return;

      event.preventDefault();
      if (event.shiftKey) {
        redoLayout();
      } else {
        undoLayout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redoLayout, undoLayout]);

  useEffect(() => {
    let cancelled = false;
    const loadDefaultLayout = async () => {
      try {
        const defaultLayout = await apiRef.current.getDefaultLayout();
        const layoutName = defaultLayout.name || "preset";
        const data = await apiRef.current.getLayout(layoutName);
        if (!cancelled && data) {
          applyLayout(data, layoutName);
        }
        const entries = await refreshLayouts();
        if (!cancelled) {
          const entry = entries.find((e) => e.name === layoutName);
          setSelectedLayout(
            entry
              ? layoutSelectionValue(entry.name, entry.builtin)
              : layoutName,
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
  }, [applyLayout, refreshLayouts]);

  useEffect(() => {
    setSelectedButtonIndex((current) => {
      if (current === null) return null;
      return Math.min(current, Math.max(0, layout.totalbuttonshow - 1));
    });
    setSelectedButtonIndexes((current) =>
      current.filter((index) => index < layout.totalbuttonshow),
    );
  }, [layout.totalbuttonshow]);

  const updateLayout = useCallback(
    (updater: (layout: Layout) => void) => {
      setLayout((current) => {
        const next = cloneLayout(current);
        updater(next);
        if (sameLayout(current, next)) return current;
        pushUndoSnapshot(current);
        redoStackRef.current = [];
        syncLayoutHistoryAvailability();
        layoutRef.current = next;
        return next;
      });
    },
    [pushUndoSnapshot, syncLayoutHistoryAvailability],
  );

  const updateBackgroundSize = useCallback((width: number, height: number) => {
    setLayout((current) => {
      if (
        current.background.w === String(width) &&
        current.background.h === String(height)
      )
        return current;
      const next = cloneLayout(current);
      next.background.w = String(width);
      next.background.h = String(height);
      layoutRef.current = next;
      return next;
    });
  }, []);

  const handleButtonPositionChange = useCallback(
    (index: number, x: number, y: number) => {
      setLayout((current) => {
        const next = cloneLayout(current);
        if (!next.buttons[index])
          next.buttons[index] = createEmptyButtonLayout();
        next.buttons[index].x = String(x);
        next.buttons[index].y = String(y);
        layoutRef.current = next;
        return next;
      });
    },
    [],
  );

  const handleStickPositionChange = useCallback((x: number, y: number) => {
    setLayout((current) => {
      const next = cloneLayout(current);
      next.stick.x = String(x);
      next.stick.y = String(y);
      layoutRef.current = next;
      return next;
    });
  }, []);

  const beginLayoutDrag = useCallback(() => {
    dragHistoryStartRef.current = cloneLayout(layoutRef.current);
  }, []);

  const endLayoutDrag = useCallback(() => {
    const startLayout = dragHistoryStartRef.current;
    dragHistoryStartRef.current = null;
    if (!startLayout || sameLayout(startLayout, layoutRef.current)) return;
    pushUndoSnapshot(startLayout);
    redoStackRef.current = [];
    syncLayoutHistoryAvailability();
  }, [pushUndoSnapshot, syncLayoutHistoryAvailability]);

  const updateSelection = useCallback(
    (selection: { buttonIndexes: number[]; stick: boolean }) => {
      setSelectedButtonIndexes(selection.buttonIndexes);
      setSelectedStick(selection.stick);
      setSelectedButtonIndex(selection.buttonIndexes[0] ?? null);
    },
    [],
  );

  const selectButtonAndStartAssignment = useCallback(
    (index: number) => {
      setSelectedButtonIndexes([index]);
      setSelectedStick(false);
      setSelectedButtonIndex(index);
      startAssignment(index);
    },
    [startAssignment],
  );

  const selectStickAndStartAssignment = useCallback(
    (index: number) => {
      setSelectedButtonIndexes([]);
      setSelectedStick(true);
      setSelectedButtonIndex(null);
      startAssignment(1000 + index);
    },
    [startAssignment],
  );

  const clearSelection = useCallback(() => {
    setSelectedButtonIndexes([]);
    setSelectedStick(false);
    setSelectedButtonIndex(null);
  }, []);

  const clearSelectionOnPreviewOutsideClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("#preview-container")) return;
      if (target.closest(".preview-history-toolbar, .preview-toolbar")) return;
      clearSelection();
    },
    [clearSelection],
  );

  const copyObsUrl = useCallback(async () => {
    await navigator.clipboard.writeText(obsUrl);
    setCopiedObsUrl(true);
    window.setTimeout(() => setCopiedObsUrl(false), 2000);
  }, [obsUrl]);

  const loadLayout = async () => {
    if (!selectedLayout) return;
    const name = layoutNameFromSelection(selectedLayout);
    try {
      const data = await apiRef.current.getLayout(name);
      applyLayout(data, name);
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
      await apiRef.current.saveLayout(name, data);
      await refreshLayouts();
      window.alert(t("saved"));
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  };

  const setDefaultLayout = async () => {
    const name = layoutName || layout.name || "custom";
    try {
      await apiRef.current.setDefaultLayout(name);
      window.alert(t("defaultSaved"));
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
    const dataUrl = await readFileAsDataUrl(file);

    try {
      const response = await fetch(`${SERVER_URL}/api/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: dataUrl,
          layoutName: uploadLayoutName,
          fileName: file.name,
        }),
      });
      if (response.ok) {
        const result = await response.json();
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
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  };

  const changeLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    localStorage.setItem("language", nextLanguage);
    i18n.changeLanguage(nextLanguage);
  };

  const exportLayout = () => {
    const data = cloneLayout(layout);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layoutName || "layout"}.json`;
    a.click();
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
        window.alert(t("invalidLayoutFile"));
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <MantineProvider defaultColorScheme="auto">
      <aside id="sidebar">
        <div className="sidebar-header">
          <Title order={1}>
            {t("appTitle")} <span className="app-version">v{APP_VERSION}</span>
          </Title>
          <p className="server-url">
            {t("obs")}: <span>{obsUrl}</span>
            <ActionIcon
              size="sm"
              variant="light"
              aria-label={t("copy")}
              onClick={copyObsUrl}
            >
              ⧉
            </ActionIcon>
            {copiedObsUrl && (
              <span className="copy-feedback">{t("copied")}</span>
            )}
          </p>
          <Text size="xs" c="dimmed">
            {t("obsTip")}
          </Text>
        </div>

        <DisplaySettingsPanel
          language={language}
          previewScale={previewScale}
          backgroundOpacity={backgroundOpacity}
          onLanguageChange={changeLanguage}
          onPreviewScaleChange={changePreviewScale}
          onBackgroundOpacityChange={setBackgroundOpacity}
        />

        <StickSettingsPanel layout={layout} updateLayout={updateLayout} />

        <BackgroundSettingsPanel
          layout={layout}
          fileInputRef={fileInputRef}
          updateLayout={updateLayout}
          uploadImage={uploadImage}
          openImagePicker={openImagePicker}
        />

        <ButtonSettingsPanel
          layout={layout}
          assigningTarget={assigningTarget}
          assignmentName={assignmentName}
          selectedButtonIndex={selectedButtonIndex}
          updateLayout={updateLayout}
          setSelectedButtonIndex={setSelectedButtonIndex}
          openImagePicker={openImagePicker}
          cancelAssignment={cancelAssignment}
        />

        <LayoutSettingsPanel
          layoutNames={layoutNames}
          selectedLayout={selectedLayout}
          layoutName={layoutName}
          setSelectedLayout={setSelectedLayout}
          setLayoutName={setLayoutName}
          loadLayout={loadLayout}
          saveLayout={saveLayout}
          setDefaultLayout={setDefaultLayout}
          exportLayout={exportLayout}
          importLayout={importLayout}
        />

        <GamepadStatusPanel connected={connected} gamepadName={gamepadName} />
      </aside>

      <main id="preview" onClick={clearSelectionOnPreviewOutsideClick}>
        <div className="preview-history-toolbar" role="toolbar">
          <Tooltip label={t("undo")} openDelay={300}>
            <ActionIcon
              size="sm"
              variant="light"
              aria-label={t("undo")}
              onClick={undoLayout}
              disabled={!historyAvailability.canUndo}
            >
              <span className="preview-history-icon">↶</span>
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t("redo")} openDelay={300}>
            <ActionIcon
              size="sm"
              variant="light"
              aria-label={t("redo")}
              onClick={redoLayout}
              disabled={!historyAvailability.canRedo}
            >
              <span className="preview-history-icon">↷</span>
            </ActionIcon>
          </Tooltip>
        </div>
        <div
          className="preview-toolbar"
          role="toolbar"
          aria-label={t("previewZoom")}
        >
          <ActionIcon
            size="sm"
            variant="light"
            aria-label={t("zoomOut")}
            onClick={() => zoomPreview(-PREVIEW_SCALE_STEP)}
            disabled={previewScale <= MIN_PREVIEW_SCALE}
          >
            <span className="preview-zoom-icon preview-zoom-minus" />
          </ActionIcon>
          <Text className="preview-zoom-value" size="xs" fw={600}>
            {zoomPercent}%
          </Text>
          <ActionIcon
            size="sm"
            variant="light"
            aria-label={t("zoomIn")}
            onClick={() => zoomPreview(PREVIEW_SCALE_STEP)}
            disabled={previewScale >= MAX_PREVIEW_SCALE}
          >
            <span className="preview-zoom-icon preview-zoom-plus" />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            aria-label={t("resetZoom")}
            onClick={() => changePreviewScale(1)}
          >
            <span className="preview-reset-icon">1x</span>
          </ActionIcon>
        </div>
        <div id="preview-scroll">
          <div
            id="preview-container"
            style={{
              width: scaledPreviewWidth,
              height: scaledPreviewHeight,
            }}
          >
            <div
              id="preview-frame"
              style={{
                transform: `scale(${previewScale})`,
              }}
            >
              <GamepadView
                layout={layout}
                stickClass={snapshot.stickClass}
                pressedButtons={snapshot.pressedButtons}
                backgroundOpacity={backgroundOpacity}
                editorMode
                selectedButtonIndex={selectedButtonIndex}
                selectedButtonIndexes={selectedButtonIndexes}
                selectedStick={selectedStick}
                onBackgroundSizeChange={updateBackgroundSize}
                onButtonClick={selectButtonAndStartAssignment}
                onStickClick={selectStickAndStartAssignment}
                onSelectionChange={updateSelection}
                onLayoutDragStart={beginLayoutDrag}
                onLayoutDragEnd={endLayoutDrag}
                onButtonPositionChange={handleButtonPositionChange}
                onStickPositionChange={handleStickPositionChange}
              />
            </div>
          </div>
        </div>
      </main>
    </MantineProvider>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<EditorApp />);
}
