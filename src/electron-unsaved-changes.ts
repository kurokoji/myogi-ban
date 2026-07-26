interface PreventableUnloadEvent {
  preventDefault: () => void;
}

interface UnsavedChangesDialogOptions {
  type: "question";
  buttons: string[];
  title: string;
  message: string;
  detail: string;
  defaultId: number;
  cancelId: number;
  noLink: boolean;
}

export function confirmElectronUnload(
  event: PreventableUnloadEvent,
  confirmDiscard: () => boolean,
): void {
  if (confirmDiscard()) event.preventDefault();
}

export function electronUnsavedChangesDialog(
  locale: string,
): UnsavedChangesDialogOptions {
  const japanese = locale.toLowerCase().startsWith("ja");
  return {
    type: "question",
    buttons: japanese
      ? ["破棄して終了", "キャンセル"]
      : ["Discard and quit", "Cancel"],
    title: japanese ? "未保存の変更" : "Unsaved changes",
    message: japanese
      ? "未保存の変更があります。"
      : "You have unsaved changes.",
    detail: japanese
      ? "変更を破棄してアプリを終了しますか？"
      : "Discard your changes and quit the application?",
    defaultId: 1,
    cancelId: 1,
    noLink: true,
  };
}
