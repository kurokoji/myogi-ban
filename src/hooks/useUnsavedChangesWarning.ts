import { useEffect, useRef, useState } from "react";

interface UseUnsavedChangesWarningResult {
  confirmingClose: boolean;
  confirmClose: () => void;
  cancelClose: () => void;
}

/**
 * In Electron, showing the confirmation via a blocking main-process dialog
 * (dialog.showMessageBoxSync) left the renderer's focus state desynced from
 * the OS window after it closed, breaking NativeSelect until the window
 * lost and regained focus. Instead, prevent the unload as usual, then show
 * an in-app modal; confirming sets a ref so the next beforeunload isn't
 * blocked, and retriggers the close via window.close(). Outside Electron
 * there is no such bug and no way to show custom UI during unload anyway,
 * so this just relies on the browser's native "leave site" prompt.
 */
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  isElectron: boolean = navigator.userAgent.includes("Electron"),
): UseUnsavedChangesWarningResult {
  const [confirmingClose, setConfirmingClose] = useState(false);
  const allowCloseRef = useRef(false);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const preventUnload = (event: BeforeUnloadEvent) => {
      if (allowCloseRef.current) return;
      event.preventDefault();
      event.returnValue = "";
      if (isElectron) setConfirmingClose(true);
    };
    window.addEventListener("beforeunload", preventUnload);
    return () => window.removeEventListener("beforeunload", preventUnload);
  }, [hasUnsavedChanges, isElectron]);

  const confirmClose = () => {
    allowCloseRef.current = true;
    setConfirmingClose(false);
    window.close();
  };

  const cancelClose = () => {
    setConfirmingClose(false);
  };

  return { confirmingClose, confirmClose, cancelClose };
}
