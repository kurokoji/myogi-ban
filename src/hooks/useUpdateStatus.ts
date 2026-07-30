import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ApiClient } from "../api";
import { UPDATE_DOWNLOAD_POLL_INTERVAL_MS } from "../app-constants";
import type { UpdateStatus } from "../update-manager";

export interface UseUpdateStatusResult {
  status: UpdateStatus | null;
  dismissed: boolean;
  checking: boolean;
  actionError: string | null;
  dismiss: () => void;
  checkNow: () => Promise<void>;
  download: () => Promise<void>;
  install: () => Promise<void>;
}

export function useUpdateStatus(
  api: ApiClient,
  downloadPollIntervalMs = UPDATE_DOWNLOAD_POLL_INTERVAL_MS,
): UseUpdateStatusResult {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getUpdateStatus()
      .then((next) => {
        if (!cancelled) setStatus(next);
      })
      .catch(() => {
        // No update information is available on mount; stay hidden.
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (status?.download.state !== "downloading") return;
    const interval = setInterval(async () => {
      try {
        setStatus(await api.getUpdateStatus());
      } catch {
        // Keep the last known progress if a poll fails.
      }
    }, downloadPollIntervalMs);
    return () => clearInterval(interval);
  }, [api, status?.download.state, downloadPollIntervalMs]);

  const checkNow = async () => {
    setChecking(true);
    try {
      const next = await api.checkForUpdate();
      setStatus(next);
      if (next.updateAvailable) setDismissed(false);
    } finally {
      setChecking(false);
    }
  };

  const download = async () => {
    setActionError(null);
    try {
      await api.startUpdateDownload();
      setStatus(await api.getUpdateStatus());
    } catch {
      setActionError(t("updateActionFailed"));
    }
  };

  const install = async () => {
    setActionError(null);
    try {
      await api.installUpdate();
    } catch {
      setActionError(t("updateActionFailed"));
    }
  };

  return {
    status,
    dismissed,
    checking,
    actionError,
    dismiss: () => setDismissed(true),
    checkNow,
    download,
    install,
  };
}
