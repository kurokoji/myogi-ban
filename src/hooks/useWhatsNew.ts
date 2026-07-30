import { useEffect, useState } from "react";
import type { ApiClient } from "../api";
import type { ReleaseNotes } from "../whats-new-manager";

export interface UseWhatsNewResult {
  popup: ReleaseNotes | null;
  viewing: boolean;
  dismiss: () => void;
  viewNotes: () => Promise<void>;
}

export function useWhatsNew(api: ApiClient): UseWhatsNewResult {
  const [popup, setPopup] = useState<ReleaseNotes | null>(null);
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getWhatsNew()
      .then((status) => {
        if (!cancelled && status.show) {
          setPopup({
            version: status.version,
            notes: status.notes,
            releaseUrl: status.releaseUrl,
          });
        }
      })
      .catch(() => {
        // No update information is available on mount; stay hidden.
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const viewNotes = async () => {
    setViewing(true);
    try {
      setPopup(await api.getCurrentReleaseNotes());
    } finally {
      setViewing(false);
    }
  };

  return {
    popup,
    viewing,
    dismiss: () => setPopup(null),
    viewNotes,
  };
}
