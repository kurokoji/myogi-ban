import {
  IconCopy,
  IconLayersSelected,
  IconLayersSelectedBottom,
  IconRestore,
  IconRotateClockwise,
  IconSpacingHorizontal,
  IconSpacingVertical,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { editorShortcutHint } from "../../editor-keyboard";

interface EditorContextMenuProps {
  x: number;
  y: number;
  showButtonActions: boolean;
  showDistributionActions?: boolean;
  canDuplicate?: boolean;
  onDuplicate: () => void;
  onResetToDefault: () => void;
  onResetRotation: () => void;
  onDistributeHorizontally?: () => void;
  onDistributeVertically?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EditorContextMenu({
  x,
  y,
  showButtonActions,
  showDistributionActions = false,
  canDuplicate = true,
  onDuplicate,
  onResetToDefault,
  onResetRotation,
  onDistributeHorizontally,
  onDistributeVertically,
  onBringToFront,
  onSendToBack,
  onDelete,
  onClose,
}: EditorContextMenuProps): React.ReactElement {
  const { t } = useTranslation();
  const runAndClose = (action: () => void) => {
    action();
    onClose();
  };

  useEffect(() => {
    const closeOnPointerDown = () => onClose();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    document.addEventListener("mousedown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="editor-context-menu"
      role="menu"
      style={{ left: x, top: y }}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {showButtonActions && (
        <>
          <button
            type="button"
            role="menuitem"
            className="editor-context-menu-item"
            aria-label={t("duplicateSelection")}
            disabled={!canDuplicate}
            onClick={() => runAndClose(onDuplicate)}
          >
            <IconCopy size={16} />
            <span className="editor-context-menu-label">
              {t("duplicateSelection")}
            </span>
            <kbd className="editor-context-menu-shortcut">
              {editorShortcutHint("duplicate")}
            </kbd>
          </button>
          {showDistributionActions && (
            <>
              <button
                type="button"
                role="menuitem"
                className="editor-context-menu-item"
                onClick={() => runAndClose(() => onDistributeHorizontally?.())}
              >
                <IconSpacingHorizontal size={16} />
                {t("distributeHorizontally")}
              </button>
              <button
                type="button"
                role="menuitem"
                className="editor-context-menu-item"
                onClick={() => runAndClose(() => onDistributeVertically?.())}
              >
                <IconSpacingVertical size={16} />
                {t("distributeVertically")}
              </button>
            </>
          )}
          <button
            type="button"
            role="menuitem"
            className="editor-context-menu-item"
            onClick={() => runAndClose(onResetToDefault)}
          >
            <IconRestore size={16} />
            {t("resetToDefault")}
          </button>
          <button
            type="button"
            role="menuitem"
            className="editor-context-menu-item"
            aria-label={t("resetRotation")}
            onClick={() => runAndClose(onResetRotation)}
          >
            <IconRotateClockwise size={16} />
            <span className="editor-context-menu-label">
              {t("resetRotation")}
            </span>
            <kbd className="editor-context-menu-shortcut">R</kbd>
          </button>
          <button
            type="button"
            role="menuitem"
            className="editor-context-menu-item"
            onClick={() => runAndClose(() => onBringToFront?.())}
          >
            <IconLayersSelected size={16} />
            {t("bringToFront")}
          </button>
          <button
            type="button"
            role="menuitem"
            className="editor-context-menu-item"
            onClick={() => runAndClose(() => onSendToBack?.())}
          >
            <IconLayersSelectedBottom size={16} />
            {t("sendToBack")}
          </button>
          <div className="editor-context-menu-separator" />
        </>
      )}
      <button
        type="button"
        role="menuitem"
        className="editor-context-menu-item editor-context-menu-item-danger"
        aria-label={t("deleteSelection")}
        onClick={() => runAndClose(onDelete)}
      >
        <IconTrash size={16} />
        <span className="editor-context-menu-label">
          {t("deleteSelection")}
        </span>
        <kbd className="editor-context-menu-shortcut">Delete</kbd>
      </button>
    </div>,
    document.body,
  );
}
