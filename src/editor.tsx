import {
  ActionIcon,
  Button,
  MantineProvider,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBrandGithub,
  IconCopy,
} from "@tabler/icons-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import "@fontsource-variable/m-plus-2/wght.css";
import "@fontsource-variable/m-plus-code-latin/wght.css";
import "./i18n";
import { ApiClient } from "./api";
import { REPO_URL } from "./app-constants";
import { resetButtonToDefaults } from "./button-settings";
import { ConfirmationModal } from "./components/editor/ConfirmationModal";
import { DragCoordinateTooltip } from "./components/editor/DragCoordinateTooltip";
import { InspectorTabs } from "./components/editor/InspectorTabs";
import { PreviewZoomControls } from "./components/editor/PreviewZoomControls";
import {
  BackgroundSettingsPanel,
  ButtonSettingsPanel,
  DisplaySettingsPanel,
  GamepadStatusPanel,
  LayoutSettingsPanel,
  StickSettingsPanel,
} from "./components/editor/SettingsPanels";
import { ShortcutCheatSheet } from "./components/editor/ShortcutCheatSheet";
import { SidebarAccordion } from "./components/editor/SidebarAccordion";
import { ThemeControl } from "./components/editor/ThemeControl";
import { UpdateCheckButton } from "./components/editor/UpdateCheckButton";
import { UpdatePopup } from "./components/editor/UpdatePopup";
import { WhatsNewPopup } from "./components/editor/WhatsNewPopup";
import { GamepadView } from "./components/GamepadView";
import {
  addEditorButton,
  type ButtonPositionUpdate,
  deleteEditorButtons,
  distributeEditorButtons,
  duplicateEditorButtons,
  reorderEditorButtons,
  withButtonPositions,
} from "./editor-buttons";
import { cloneLayout, updateSelectedButtonSettings } from "./editor-helpers";
import {
  deleteEditorSelection,
  editorNudgeHistoryMode,
  editorShortcutFromKey,
  editorShortcutHint,
  isEditableKeyboardTarget,
  nudgeEditorSelection,
} from "./editor-keyboard";
import {
  applyEditorResize,
  applyEditorRotation,
  type EditorResizeChange,
} from "./editor-resize";
import {
  createButtonSelection,
  EMPTY_EDITOR_SELECTION,
  normalizeEditorSelection,
  resolveInspectorTarget,
  toggleButtonInSelection,
  visibleInspectorTargets,
} from "./editor-selection";
import { editorTheme } from "./editor-theme";
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
import { useUnsavedChangesWarning } from "./hooks/useUnsavedChangesWarning";
import { useUpdateStatus } from "./hooks/useUpdateStatus";
import { useWhatsNew } from "./hooks/useWhatsNew";
import i18n from "./i18n";
import { createDefaultLayout } from "./layout";
import { previewWheelZoomDelta } from "./preview-viewport";
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
  const [snappingEnabled, setSnappingEnabled] = useState(true);
  const [dragCoordinate, setDragCoordinate] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);
  const [buttonAspectRatioLinked, setButtonAspectRatioLinked] = useState(true);
  const [stickAspectRatioLinked, setStickAspectRatioLinked] = useState(true);
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

  useEffect(() => {
    const previewScroll = previewScrollRef.current;
    if (!previewScroll) return;
    const zoomOnWheel = (event: WheelEvent) => {
      const delta = previewWheelZoomDelta(event);
      if (delta === null) return;
      event.preventDefault();
      zoomPreview(delta);
    };
    previewScroll.addEventListener("wheel", zoomOnWheel, { passive: false });
    return () => previewScroll.removeEventListener("wheel", zoomOnWheel);
  }, [zoomPreview]);

  useEffect(() => {
    window.addEventListener("pointerup", endLayoutDrag);
    return () => window.removeEventListener("pointerup", endLayoutDrag);
  }, [endLayoutDrag]);
  const {
    previewContainerRef,
    previewRef,
    rulerOrigin,
    startExistingGuideDrag,
    startGuideDrag,
    updateRulerOrigin,
  } = useEditorGuides({
    layoutRef,
    previewScale,
    setLayout,
    onDragStart: beginLayoutDrag,
    onDragEnd: endLayoutDrag,
    onDragCoordinateChange: setDragCoordinate,
  });
  const {
    cancelImport,
    cancelPendingAction,
    confirmImport,
    confirmPendingAction,
    currentBuiltin,
    deleteLayout,
    exportLayout,
    fileInputRef,
    importInProgress,
    importLayout,
    layoutName,
    layoutNames,
    openLayout,
    openImagePicker,
    pendingConfirmation,
    pendingImport,
    saveLayout,
    saveLayoutAs,
    selectedLayout,
    setDefaultLayout,
    status,
    uploadImage,
    isDirty,
    isDefaultLayout,
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
      layoutPackageImageInvalid: t("layoutPackageImageInvalid"),
      layoutPackageTooLarge: t("layoutPackageTooLarge"),
      layoutPackageUnsafe: t("layoutPackageUnsafe"),
      operationFailed: t("operationFailed"),
      discardChanges: t("discardChanges"),
      discardAndOpen: t("discardAndOpen"),
      discardAndImport: t("discardAndImport"),
      confirmDelete: t("confirmDelete"),
      deleteLayout: t("deleteLayout"),
      deleted: t("deleted"),
      layoutNameExists: t("layoutNameExists"),
    },
  });
  const { confirmingClose, confirmClose, cancelClose } =
    useUnsavedChangesWarning(isDirty);
  const updateStatus = useUpdateStatus(apiRef.current);
  const whatsNew = useWhatsNew(apiRef.current);

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

  const deleteSelection = useCallback(
    (target: { buttonIndexes: number[]; stick: boolean }) => {
      const deleted = deleteEditorSelection(
        layoutRef.current,
        buttonMappings,
        {
          ...target,
          primaryButtonIndex: target.buttonIndexes[0] ?? null,
        },
        "Delete",
      );
      if (!deleted) return false;
      updateLayout((next) => Object.assign(next, deleted.layout));
      setButtonMappings(deleted.mapping);
      setSelection(EMPTY_EDITOR_SELECTION);
      cancelAssignment();
      return true;
    },
    [buttonMappings, cancelAssignment, updateLayout],
  );

  const duplicateSelection = useCallback(
    (target: { buttonIndexes: number[]; stick: boolean }) => {
      const duplicated = duplicateEditorButtons(
        layoutRef.current,
        buttonMappings,
        target.buttonIndexes,
      );
      if (!duplicated) return;
      updateLayout((next) => Object.assign(next, duplicated.layout));
      setButtonMappings(duplicated.mapping);
      setSelection({
        buttonIndexes: duplicated.indexes,
        primaryButtonIndex: duplicated.indexes[0] ?? null,
        stick: false,
      });
      cancelAssignment();
    },
    [buttonMappings, cancelAssignment, updateLayout],
  );

  const resetSelectionToDefault = useCallback(
    (target: { buttonIndexes: number[]; stick: boolean }) => {
      updateLayout((next) => {
        for (const index of target.buttonIndexes) {
          const button = next.buttons[index];
          if (button) {
            next.buttons[index] = resetButtonToDefaults(
              button,
              next.defaultbuttons,
            );
          }
        }
      });
    },
    [updateLayout],
  );

  const resetSelectionRotation = useCallback(
    (target: { buttonIndexes: number[]; stick: boolean }) => {
      updateLayout((next) => {
        for (const index of target.buttonIndexes) {
          if (next.buttons[index]) next.buttons[index].rotation = "0";
        }
      });
    },
    [updateLayout],
  );

  const reorderSelection = useCallback(
    (
      target: { buttonIndexes: number[]; stick: boolean },
      edge: "front" | "back",
    ) => {
      const reordered = reorderEditorButtons(
        layoutRef.current,
        buttonMappings,
        target.buttonIndexes,
        edge,
      );
      updateLayout((next) => Object.assign(next, reordered.layout));
      setButtonMappings(reordered.mapping);
      setSelection({
        buttonIndexes: reordered.indexes,
        primaryButtonIndex: reordered.indexes[0] ?? null,
        stick: false,
      });
      cancelAssignment();
    },
    [buttonMappings, cancelAssignment, updateLayout],
  );

  const distributeSelection = useCallback(
    (
      target: { buttonIndexes: number[]; stick: boolean },
      direction: "horizontal" | "vertical",
    ) => {
      const distributed = distributeEditorButtons(
        layoutRef.current,
        target.buttonIndexes,
        direction,
      );
      if (!distributed) return;
      updateLayout((next) => Object.assign(next, distributed));
      cancelAssignment();
    },
    [cancelAssignment, updateLayout],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target)) return;

      const shortcut = editorShortcutFromKey(event);
      if (shortcut === "save") {
        event.preventDefault();
        if (!event.repeat && !currentBuiltin) saveLayout();
        return;
      }
      if (shortcut === "clearSelection") {
        if (selection.buttonIndexes.length === 0 && !selection.stick) return;
        event.preventDefault();
        setSelection(EMPTY_EDITOR_SELECTION);
        cancelAssignment();
        return;
      }
      if (shortcut === "selectAll") {
        event.preventDefault();
        const buttonIndexes = Array.from(
          { length: layoutRef.current.totalbuttonshow },
          (_, index) => index,
        );
        setSelection({
          buttonIndexes,
          primaryButtonIndex: buttonIndexes[0] ?? null,
          stick: false,
        });
        cancelAssignment();
        return;
      }
      if (shortcut === "undo") {
        event.preventDefault();
        if (!event.repeat) undoLayout();
        return;
      }
      if (shortcut === "redo") {
        event.preventDefault();
        if (!event.repeat) redoLayout();
        return;
      }
      if (shortcut === "delete" && deleteSelection(selection)) {
        event.preventDefault();
        return;
      }
      if (shortcut === "duplicate" && selection.buttonIndexes.length > 0) {
        event.preventDefault();
        if (!event.repeat) duplicateSelection(selection);
        return;
      }
      if (shortcut === "resetRotation" && selection.buttonIndexes.length > 0) {
        event.preventDefault();
        if (!event.repeat) resetSelectionRotation(selection);
        return;
      }
      const moved = nudgeEditorSelection(
        layoutRef.current,
        selection,
        event.key,
      );
      if (!moved) return;
      event.preventDefault();
      if (editorNudgeHistoryMode(event.repeat) === "record") {
        updateLayout((next) => Object.assign(next, moved));
        return;
      }
      setLayout(moved);
      layoutRef.current = moved;
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cancelAssignment,
    currentBuiltin,
    deleteSelection,
    duplicateSelection,
    redoLayout,
    resetSelectionRotation,
    saveLayout,
    selection,
    undoLayout,
    updateLayout,
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

  const handleSizeChange = useCallback((change: EditorResizeChange) => {
    setLayout((current) => {
      const next = applyEditorResize(current, change);
      layoutRef.current = next;
      return next;
    });
  }, []);

  const handleRotationChange = useCallback(
    (change: { index: number; rotation: number }) => {
      setLayout((current) => {
        const next = applyEditorRotation(current, change);
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
    (index: number | null, toggleSelection: boolean) => {
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
      if (index !== null) startAssignment(1000 + index);
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
    <MantineProvider defaultColorScheme="auto" theme={editorTheme}>
      <ConfirmationModal
        message={confirmingClose ? t("discardAndQuitMessage") : null}
        confirmLabel={t("discardAndQuit")}
        onConfirm={confirmClose}
        onCancel={cancelClose}
      />
      <UpdatePopup
        status={updateStatus.status}
        dismissed={updateStatus.dismissed}
        actionError={updateStatus.actionError}
        onClose={updateStatus.dismiss}
        onDownload={updateStatus.download}
        onInstall={updateStatus.install}
        onDownloadObsPlugin={updateStatus.downloadObsPlugin}
        onInstallObsPlugin={updateStatus.installObsPlugin}
      />
      <WhatsNewPopup notes={whatsNew.popup} onClose={whatsNew.dismiss} />
      <aside id="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <Title order={1}>
              {t("appTitle")}{" "}
              <span className="app-version">v{APP_VERSION}</span>
            </Title>
            <div className="sidebar-title-actions">
              <ActionIcon
                size="sm"
                variant="subtle"
                component="a"
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={t("githubRepository")}
              >
                <IconBrandGithub size={16} />
              </ActionIcon>
              <ThemeControl />
            </div>
          </div>
          <div className="update-check-row">
            <UpdateCheckButton
              checking={updateStatus.checking}
              updateAvailable={updateStatus.status?.updateAvailable ?? false}
              onCheckNow={updateStatus.checkNow}
            />
            <Button
              size="xs"
              variant="subtle"
              loading={whatsNew.viewing}
              onClick={whatsNew.viewNotes}
            >
              {t("viewReleaseNotes")}
            </Button>
          </div>
          <p className="server-url">
            {t("obs")}: <span className="server-url-value">{obsUrl}</span>
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

        <SidebarAccordion
          fixedContent={
            <DisplaySettingsPanel
              language={language}
              hasGuides={
                layout.guides.vertical.length > 0 ||
                layout.guides.horizontal.length > 0
              }
              onLanguageChange={changeLanguage}
              onClearGuides={clearGuides}
            />
          }
          sections={[
            {
              value: "layout",
              label: t("layout"),
              content: (
                <LayoutSettingsPanel
                  currentBuiltin={currentBuiltin}
                  isDefaultLayout={isDefaultLayout}
                  isDirty={isDirty}
                  layoutNames={layoutNames}
                  selectedLayout={selectedLayout}
                  layoutName={layoutName}
                  layoutFormatVersion={layout.sourceFormatVersion}
                  openLayout={openLayout}
                  saveLayout={saveLayout}
                  saveLayoutAs={saveLayoutAs}
                  deleteLayout={deleteLayout}
                  setDefaultLayout={setDefaultLayout}
                  exportLayout={exportLayout}
                  importLayout={importLayout}
                  importInProgress={importInProgress}
                  pendingImport={pendingImport}
                  confirmImport={confirmImport}
                  cancelImport={cancelImport}
                  pendingConfirmation={pendingConfirmation}
                  confirmPendingAction={confirmPendingAction}
                  cancelPendingAction={cancelPendingAction}
                  status={status}
                />
              ),
            },
            {
              value: "gamepad",
              label: t("gamepad"),
              content: (
                <GamepadStatusPanel
                  connected={connected}
                  gamepadName={gamepadName}
                />
              ),
            },
          ]}
        />
      </aside>

      <main
        id="preview"
        onClick={clearSelectionOnPreviewOutsideClick}
        ref={previewRef}
      >
        <div className="preview-history-toolbar" role="toolbar">
          <Tooltip
            label={`${t("undo")} (${editorShortcutHint("undo")})`}
            openDelay={300}
          >
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
          <Tooltip
            label={`${t("redo")} (${editorShortcutHint("redo")})`}
            openDelay={300}
          >
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
          <ShortcutCheatSheet />
        </div>
        <PreviewZoomControls
          zoomPercent={zoomPercent}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          snappingEnabled={snappingEnabled}
          onZoomOut={() => zoomPreview(-PREVIEW_SCALE_STEP)}
          onZoomIn={() => zoomPreview(PREVIEW_SCALE_STEP)}
          onReset={() => changePreviewScale(1)}
          onSnappingChange={setSnappingEnabled}
        />
        <div
          id="preview-scroll"
          onScroll={updateRulerOrigin}
          ref={previewScrollRef}
        >
          <div className="preview-ruler-corner" aria-hidden="true" />
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
                  style={{
                    left: `calc(${rulerOrigin.x + value * previewScale}px - var(--preview-ruler-size))`,
                  }}
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
                  style={{
                    top: `calc(${rulerOrigin.y + value * previewScale}px - var(--preview-ruler-size))`,
                  }}
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
                snappingEnabled={snappingEnabled}
                aspectRatioLocked={
                  selectedStick
                    ? stickAspectRatioLinked
                    : buttonAspectRatioLinked
                }
                selectionSurfaceRef={previewScrollRef}
                onBackgroundSizeChange={updateBackgroundSize}
                onButtonClick={selectButtonAndStartAssignment}
                onStickClick={selectStickAndStartAssignment}
                onSelectionChange={updateSelection}
                onLayoutDragStart={beginLayoutDrag}
                onLayoutDragEnd={endLayoutDrag}
                onPositionsChange={handlePositionsChange}
                onSizeChange={handleSizeChange}
                onRotationChange={handleRotationChange}
                onDeleteSelection={deleteSelection}
                onDuplicateSelection={duplicateSelection}
                onResetSelectionToDefault={resetSelectionToDefault}
                onResetSelectionRotation={resetSelectionRotation}
                onReorderSelection={reorderSelection}
                onDistributeSelection={distributeSelection}
                onDragCoordinateChange={setDragCoordinate}
              />
            </div>
          </div>
        </div>
      </main>
      {dragCoordinate && (
        <DragCoordinateTooltip
          x={dragCoordinate.x}
          y={dragCoordinate.y}
          label={dragCoordinate.label}
        />
      )}

      <aside id="inspector" onPointerDownCapture={beginLayoutDrag}>
        <InspectorTabs
          activeTab={resolveInspectorTarget(selection)}
          tabs={visibleInspectorTargets().map((target) => ({
            value: target,
            label: t(target),
            content:
              target === "background" ? (
                <BackgroundSettingsPanel
                  layout={layout}
                  fileInputRef={fileInputRef}
                  updateLayout={updateLayout}
                  uploadImage={uploadImage}
                  openImagePicker={openImagePicker}
                />
              ) : target === "stick" ? (
                <StickSettingsPanel
                  layout={layout}
                  updateLayout={updateLayout}
                  aspectRatioLinked={stickAspectRatioLinked}
                  onAspectRatioLinkedChange={setStickAspectRatioLinked}
                  assigningTarget={assigningTarget}
                  assignmentName={assignmentName}
                  cancelAssignment={cancelAssignment}
                />
              ) : (
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
                  aspectRatioLinked={buttonAspectRatioLinked}
                  onAspectRatioLinkedChange={setButtonAspectRatioLinked}
                />
              ),
          }))}
        />
      </aside>
    </MantineProvider>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<EditorApp />);
}
