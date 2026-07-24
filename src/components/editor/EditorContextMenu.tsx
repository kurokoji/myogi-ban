import { IconTrash } from "@tabler/icons-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface EditorContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onClose: () => void;
}

export function EditorContextMenu({
  x,
  y,
  onDelete,
  onClose,
}: EditorContextMenuProps): React.ReactElement {
  const { t } = useTranslation();

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
    >
      <button
        type="button"
        role="menuitem"
        className="editor-context-menu-item editor-context-menu-item-danger"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <IconTrash size={16} />
        {t("deleteSelection")}
      </button>
    </div>,
    document.body,
  );
}
