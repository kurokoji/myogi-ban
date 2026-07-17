import {
  ActionIcon,
  MantineProvider,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCopy,
  IconZoomIn,
  IconZoomOut,
  IconZoomReset,
} from "@tabler/icons-react";
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
  addEditorButton,
  type ButtonPositionUpdate,
  deleteEditorButtons,
  withButtonPositions,
} from "./editor-buttons";
import { cloneLayout, updateSelectedButtonSettings } from "./editor-helpers";
import {
  createButtonSelection,
  EMPTY_EDITOR_SELECTION,
  normalizeEditorSelection,
  toggleButtonInSelection,
} from "./editor-selection";
import {
  type ButtonMapping,
  GamepadManager,
  type StickMapping,
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
  const [selection, setSelection] = useState(EMPTY_EDITOR_SELECTION);
  const selectedButtonIndex = selection.primaryButtonIndex;
  const selectedButtonIndexes = selection.buttonIndexes;
  const selectedStick = selection.stick;
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
    setSelection,
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
    const normalized = normalizeEditorSelection(
      selectedButtonIndexes,
      selectedButtonIndex,
      layout.totalbuttonshow,
    );
    if (
      normalized.buttonIndexes !== selectedButtonIndexes ||
      normalized.primaryIndex !== selectedButtonIndex
    ) {
      setSelection((current) => ({
        ...current,
        buttonIndexes: normalized.buttonIndexes,
        primaryButtonIndex: normalized.primaryIndex,
      }));
    }
    if (normalized.cancelAssignment) cancelAssignment();
  }, [
    cancelAssignment,
    layout.totalbuttonshow,
    selectedButtonIndex,
    selectedButtonIndexes,
  ]);

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

  const handlePositionsChange = useCallback(
    (update: {
      buttons: ButtonPositionUpdate[];
      stick?: { x: number; y: number };
    }) => {
      setLayout((current) => {
        const next = withButtonPositions(current, update.buttons);
        if (update.stick) {
          next.stick.x = String(update.stick.x);
          next.stick.y = String(update.stick.y);
        }
        layoutRef.current = next;
        return next;
      });
    },
    [],
  );

  const updateSelection = useCallback(
    (nextSelection: { buttonIndexes: number[]; stick: boolean }) => {
      setSelection({
        ...nextSelection,
        primaryButtonIndex: nextSelection.buttonIndexes[0] ?? null,
      });
      cancelAssignment();
    },
    [cancelAssignment],
  );

  const clearSelection = useCallback(() => {
    setSelection(EMPTY_EDITOR_SELECTION);
    cancelAssignment();
  }, [cancelAssignment]);

  const selectButtonForSettings = useCallback(
    (index: number | null) => {
      if (index === null) {
        clearSelection();
        return;
      }
      setSelection(createButtonSelection(index));
      cancelAssignment();
    },
    [cancelAssignment, clearSelection],
  );

  const addButton = useCallback(() => {
    const result = addEditorButton(layout, buttonMappings);
    if (!result) return;
    updateLayout((next) => Object.assign(next, result.layout));
    setButtonMappings(result.mapping);
    const newIndex = result.index;
    setSelection(createButtonSelection(newIndex));
    cancelAssignment();
  }, [buttonMappings, cancelAssignment, layout, updateLayout]);

  const deleteSelectedButtons = useCallback(() => {
    const result = deleteEditorButtons(
      layout,
      buttonMappings,
      selectedButtonIndexes,
    );
    if (result.layout.totalbuttonshow === layout.totalbuttonshow) return;
    updateLayout((next) => Object.assign(next, result.layout));
    setButtonMappings(result.mapping);
    clearSelection();
  }, [
    clearSelection,
    buttonMappings,
    layout,
    selectedButtonIndexes,
    updateLayout,
  ]);

  const selectButtonAndStartAssignment = useCallback(
    (index: number, toggleSelection: boolean) => {
      if (toggleSelection) {
        setSelection((current) => toggleButtonInSelection(current, index));
        cancelAssignment();
        return;
      }
      setSelection(createButtonSelection(index));
      startAssignment(index);
    },
    [cancelAssignment, startAssignment],
  );

  const selectStickAndStartAssignment = useCallback(
    (index: number, toggleSelection: boolean) => {
      if (toggleSelection) {
        setSelection((current) => ({ ...current, stick: !current.stick }));
        cancelAssignment();
        return;
      }
      setSelection({
        buttonIndexes: [],
        primaryButtonIndex: null,
        stick: true,
      });
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
              <IconCopy size={16} />
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
              <IconArrowBackUp size={16} />
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
              <IconArrowForwardUp size={16} />
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
            <IconZoomOut size={16} />
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
            <IconZoomIn size={16} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            aria-label={t("resetZoom")}
            onClick={() => changePreviewScale(1)}
          >
            <IconZoomReset size={16} />
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
                onPositionsChange={handlePositionsChange}
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
