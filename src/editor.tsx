import {
  ActionIcon,
  MantineProvider,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  updateSelectedButtonSettings,
} from "./editor-helpers";
import { toggleSelectedIndex } from "./editor-selection";
import {
  type ButtonMapping,
  GamepadManager,
  type StickMapping,
  UNASSIGNED_MAPPING,
} from "./gamepad";
import { useEditorGamepad } from "./hooks/useEditorGamepad";
import { useEditorGuides } from "./hooks/useEditorGuides";
import { useEditorLayouts } from "./hooks/useEditorLayouts";
import { useLayoutHistory } from "./hooks/useLayoutHistory";
import { usePreviewViewport } from "./hooks/usePreviewViewport";
import i18n from "./i18n";
import { createDefaultLayout } from "./layout";
import { type Layout, SERVER_URL } from "./types";

const PREVIEW_SCALE_STEP = 0.1;
const APP_VERSION = process.env.npm_package_version ?? "0.0.0";
const RULER_MAJOR_STEP = 50;

function EditorApp(): React.ReactElement {
  const { t } = useTranslation();
  const apiRef = useRef(new ApiClient());
  const [layout, setLayout] = useState<Layout>(() => createDefaultLayout());
  const [buttonMappings, setButtonMappings] = useState<ButtonMapping[]>(() =>
    GamepadManager.createDefaultButtonMappings(),
  );
  const [stickMappings, setStickMappings] = useState<StickMapping[]>(() =>
    GamepadManager.createDefaultStickMappings(),
  );
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(
    null,
  );
  const [selectedButtonIndexes, setSelectedButtonIndexes] = useState<number[]>(
    [],
  );
  const [selectedStick, setSelectedStick] = useState(false);
  const [language, setLanguage] = useState(i18n.language);
  const [copiedObsUrl, setCopiedObsUrl] = useState(false);
  const layoutRef = useRef(layout);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
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
  const {
    beginDrag: beginLayoutDrag,
    clearHistory: clearLayoutHistory,
    endDrag: endLayoutDrag,
    historyAvailability,
    redoLayout,
    restoreLayout,
    undoLayout,
    updateLayout,
  } = useLayoutHistory({
    layout,
    layoutRef,
    setLayout,
    onRestore: resetSnapshot,
  });
  const {
    canZoomIn,
    canZoomOut,
    changePreviewScale,
    previewScale,
    rulerTicks,
    scaledPreviewHeight,
    scaledPreviewWidth,
    zoomPercent,
    zoomPreview,
  } = usePreviewViewport(layout.background);
  const {
    previewContainerRef,
    previewRef,
    rulerOrigin,
    startExistingGuideDrag,
    startGuideDrag,
    updateRulerOrigin,
  } = useEditorGuides({ layoutRef, previewScale, setLayout });
  const {
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
    status,
    uploadImage,
    isDirty,
  } = useEditorLayouts({
    api: apiRef.current,
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
    messages: {
      saved: t("saved"),
      defaultSaved: t("defaultSaved"),
      invalidLayoutFile: t("invalidLayoutFile"),
      operationFailed: t("operationFailed"),
      discardChanges: t("discardChanges"),
      confirmDelete: t("confirmDelete"),
      deleted: t("deleted"),
      layoutNameExists: t("layoutNameExists"),
    },
  });

  const obsUrl = `${SERVER_URL}/view`;

  useEffect(() => {
    setSelectedButtonIndexes((current) =>
      current.filter((index) => index < layout.totalbuttonshow),
    );
    if (
      selectedButtonIndex !== null &&
      selectedButtonIndex >= layout.totalbuttonshow
    ) {
      setSelectedButtonIndex(null);
      cancelAssignment();
    }
  }, [cancelAssignment, layout.totalbuttonshow, selectedButtonIndex]);

  const clearGuides = useCallback(() => {
    updateLayout((next) => {
      next.guides.vertical = [];
      next.guides.horizontal = [];
    });
  }, [updateLayout]);

  const updateSelectedButtons = useCallback(
    (updater: (layout: Layout) => void) => {
      updateLayout((next) => {
        updateSelectedButtonSettings(
          next,
          selectedButtonIndexes.length > 0
            ? selectedButtonIndexes
            : selectedButtonIndex === null
              ? []
              : [selectedButtonIndex],
          updater,
        );
      });
    },
    [selectedButtonIndex, selectedButtonIndexes, updateLayout],
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

  const updateSelection = useCallback(
    (selection: { buttonIndexes: number[]; stick: boolean }) => {
      setSelectedButtonIndexes(selection.buttonIndexes);
      setSelectedStick(selection.stick);
      setSelectedButtonIndex(selection.buttonIndexes[0] ?? null);
      cancelAssignment();
    },
    [cancelAssignment],
  );

  const clearSelection = useCallback(() => {
    setSelectedButtonIndexes([]);
    setSelectedStick(false);
    setSelectedButtonIndex(null);
    cancelAssignment();
  }, [cancelAssignment]);

  const selectButtonForSettings = useCallback(
    (index: number | null) => {
      if (index === null) {
        clearSelection();
        return;
      }
      setSelectedButtonIndexes([index]);
      setSelectedStick(false);
      setSelectedButtonIndex(index);
      cancelAssignment();
    },
    [cancelAssignment, clearSelection],
  );

  const addButton = useCallback(() => {
    if (layout.totalbuttonshow >= 48) return;
    const newIndex = layout.totalbuttonshow;
    updateLayout((next) => {
      next.buttons.splice(newIndex, 0, createEmptyButtonLayout());
      if (next.buttons.length > 48) next.buttons.pop();
      next.totalbuttonshow += 1;
    });
    setButtonMappings((current) => {
      const next = [...current];
      next.splice(newIndex, 0, UNASSIGNED_MAPPING);
      if (next.length > 48) next.pop();
      return next;
    });
    setSelectedButtonIndexes([newIndex]);
    setSelectedButtonIndex(newIndex);
    setSelectedStick(false);
    cancelAssignment();
  }, [cancelAssignment, layout.totalbuttonshow, updateLayout]);

  const deleteSelectedButtons = useCallback(() => {
    const indexes = [...selectedButtonIndexes]
      .filter((index) => index < layout.totalbuttonshow)
      .sort((a, b) => b - a);
    if (indexes.length === 0) return;
    updateLayout((next) => {
      for (const index of indexes) {
        next.buttons.splice(index, 1);
        next.buttons.push(createEmptyButtonLayout());
      }
      next.totalbuttonshow = Math.max(0, next.totalbuttonshow - indexes.length);
    });
    setButtonMappings((current) => {
      const next = [...current];
      for (const index of indexes) {
        next.splice(index, 1);
        next.push(UNASSIGNED_MAPPING);
      }
      return next;
    });
    clearSelection();
  }, [
    clearSelection,
    layout.totalbuttonshow,
    selectedButtonIndexes,
    updateLayout,
  ]);

  const selectButtonAndStartAssignment = useCallback(
    (index: number, toggleSelection: boolean) => {
      if (toggleSelection) {
        setSelectedButtonIndexes((current) => {
          const next = toggleSelectedIndex(current, index);
          setSelectedButtonIndex(next[0] ?? null);
          return next;
        });
        cancelAssignment();
        return;
      }
      setSelectedButtonIndexes([index]);
      setSelectedStick(false);
      setSelectedButtonIndex(index);
      startAssignment(index);
    },
    [cancelAssignment, startAssignment],
  );

  const selectStickAndStartAssignment = useCallback(
    (index: number, toggleSelection: boolean) => {
      if (toggleSelection) {
        setSelectedStick((current) => !current);
        cancelAssignment();
        return;
      }
      setSelectedButtonIndexes([]);
      setSelectedStick(true);
      setSelectedButtonIndex(null);
      startAssignment(1000 + index);
    },
    [cancelAssignment, startAssignment],
  );

  const clearSelectionOnPreviewOutsideClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("#preview-container")) return;
      if (target.closest(".preview-ruler")) return;
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

  const changeLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    localStorage.setItem("language", nextLanguage);
    i18n.changeLanguage(nextLanguage);
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
          hasGuides={
            layout.guides.vertical.length > 0 ||
            layout.guides.horizontal.length > 0
          }
          onLanguageChange={changeLanguage}
          onPreviewScaleChange={changePreviewScale}
          onClearGuides={clearGuides}
        />

        <LayoutSettingsPanel
          currentBuiltin={currentBuiltin}
          isDirty={isDirty}
          layoutNames={layoutNames}
          selectedLayout={selectedLayout}
          layoutName={layoutName}
          openLayout={openLayout}
          saveLayout={saveLayout}
          saveLayoutAs={saveLayoutAs}
          deleteLayout={deleteLayout}
          setDefaultLayout={setDefaultLayout}
          exportLayout={exportLayout}
          importLayout={importLayout}
          status={status}
        />

        <BackgroundSettingsPanel
          layout={layout}
          fileInputRef={fileInputRef}
          updateLayout={updateLayout}
          uploadImage={uploadImage}
          openImagePicker={openImagePicker}
        />

        <StickSettingsPanel layout={layout} updateLayout={updateLayout} />

        <ButtonSettingsPanel
          layout={layout}
          assigningTarget={assigningTarget}
          assignmentName={assignmentName}
          selectedButtonIndex={selectedButtonIndex}
          selectedButtonIndexes={selectedButtonIndexes}
          updateLayout={updateLayout}
          updateSelectedButtons={updateSelectedButtons}
          onAddButton={addButton}
          onDeleteSelectedButtons={deleteSelectedButtons}
          onSelectedButtonChange={selectButtonForSettings}
          openImagePicker={openImagePicker}
          cancelAssignment={cancelAssignment}
        />

        <GamepadStatusPanel connected={connected} gamepadName={gamepadName} />
      </aside>

      <main
        id="preview"
        onClick={clearSelectionOnPreviewOutsideClick}
        ref={previewRef}
      >
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
            disabled={!canZoomOut}
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
            disabled={!canZoomIn}
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
        <div
          id="preview-scroll"
          onScroll={updateRulerOrigin}
          ref={previewScrollRef}
        >
          <div
            className="preview-ruler preview-ruler-horizontal"
            aria-hidden="true"
            onMouseDown={(event) => startGuideDrag("y", event)}
          >
            {rulerTicks.map((value) => {
              const major = value % RULER_MAJOR_STEP === 0;
              return (
                <span
                  className={`preview-ruler-tick ${major ? "preview-ruler-tick-major" : ""}`}
                  key={value}
                  style={{ left: rulerOrigin.x + value * previewScale }}
                >
                  {major && (
                    <span className="preview-ruler-label">{value}</span>
                  )}
                </span>
              );
            })}
          </div>
          <div
            className="preview-ruler preview-ruler-vertical"
            aria-hidden="true"
            onMouseDown={(event) => startGuideDrag("x", event)}
          >
            {rulerTicks.map((value) => {
              const major = value % RULER_MAJOR_STEP === 0;
              return (
                <span
                  className={`preview-ruler-tick ${major ? "preview-ruler-tick-major" : ""}`}
                  key={value}
                  style={{ top: rulerOrigin.y + value * previewScale }}
                >
                  {major && (
                    <span className="preview-ruler-label">{value}</span>
                  )}
                </span>
              );
            })}
          </div>
          <div className="preview-guides" aria-hidden="true">
            {layout.guides.vertical.map((guide, index) => (
              <span
                className="preview-guide preview-guide-vertical"
                key={`x-${index}`}
                onMouseDown={(event) =>
                  startExistingGuideDrag("x", index, event)
                }
                style={{ left: rulerOrigin.x + guide * previewScale }}
              />
            ))}
            {layout.guides.horizontal.map((guide, index) => (
              <span
                className="preview-guide preview-guide-horizontal"
                key={`y-${index}`}
                onMouseDown={(event) =>
                  startExistingGuideDrag("y", index, event)
                }
                style={{ top: rulerOrigin.y + guide * previewScale }}
              />
            ))}
          </div>
          <div
            id="preview-container"
            ref={previewContainerRef}
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
                backgroundOpacity={layout.background.opacity}
                editorMode
                selectedButtonIndex={selectedButtonIndex}
                selectedButtonIndexes={selectedButtonIndexes}
                selectedStick={selectedStick}
                selectionSurfaceRef={previewScrollRef}
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
