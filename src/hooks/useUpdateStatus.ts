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
  installing: boolean;
  installingObsPlugin: boolean;
  dismiss: () => void;
  checkNow: () => Promise<void>;
  download: () => Promise<void>;
  install: () => Promise<void>;
  downloadObsPlugin: () => Promise<void>;
  installObsPlugin: () => Promise<void>;
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
  const [installing, setInstalling] = useState(false);
  const [installingObsPlugin, setInstallingObsPlugin] = useState(false);

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
    const downloading =
      status?.download.state === "downloading" ||
      status?.obsPluginDownload.state === "downloading";
    if (!downloading) return;
    const interval = setInterval(async () => {
      try {
        setStatus(await api.getUpdateStatus());
      } catch {
        // Keep the last known progress if a poll fails.
      }
    }, downloadPollIntervalMs);
    return () => clearInterval(interval);
  }, [
    api,
    status?.download.state,
    status?.obsPluginDownload.state,
    downloadPollIntervalMs,
  ]);

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
    setInstalling(true);
    try {
      await api.installUpdate();
      // Stay in the loading state: a successful call means the app is
      // already quitting to hand off to the installer, so there is no
      // "done" state to return to.
    } catch {
      setActionError(t("updateActionFailed"));
      setInstalling(false);
    }
  };

  const downloadObsPlugin = async () => {
    setActionError(null);
    try {
      await api.startObsPluginDownload();
      setStatus(await api.getUpdateStatus());
    } catch {
      setActionError(t("updateActionFailed"));
    }
  };

  const installObsPlugin = async () => {
    setActionError(null);
    setInstallingObsPlugin(true);
    try {
      await api.installObsPlugin();
    } catch {
      setActionError(t("updateActionFailed"));
    } finally {
      setInstallingObsPlugin(false);
    }
  };

  return {
    status,
    dismissed,
    checking,
    actionError,
    installing,
    installingObsPlugin,
    dismiss: () => setDismissed(true),
    checkNow,
    download,
    install,
    downloadObsPlugin,
    installObsPlugin,
  };
}
