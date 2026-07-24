import {
  IconCopy,
  IconLayersSelected,
  IconLayersSelectedBottom,
  IconRestore,
  IconRotateClockwise,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface EditorContextMenuProps {
  x: number;
  y: number;
  showButtonActions: boolean;
  canDuplicate?: boolean;
  onDuplicate: () => void;
  onResetToDefault: () => void;
  onResetRotation: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EditorContextMenu({
  x,
  y,
  showButtonActions,
  canDuplicate = true,
  onDuplicate,
  onResetToDefault,
  onResetRotation,
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
      if (event.key === "Escape") onClose();
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
            disabled={!canDuplicate}
            onClick={() => runAndClose(onDuplicate)}
          >
            <IconCopy size={16} />
            {t("duplicateSelection")}
          </button>
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
            onClick={() => runAndClose(onResetRotation)}
          >
            <IconRotateClockwise size={16} />
            {t("resetRotation")}
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
        onClick={() => runAndClose(onDelete)}
      >
        <IconTrash size={16} />
        {t("deleteSelection")}
      </button>
    </div>,
    document.body,
  );
}
