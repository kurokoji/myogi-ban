import { createWriteStream, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { isNewerVersion, parseLatestRelease } from "./update-check";

export class UpdateNotSupportedError extends Error {
  constructor() {
    super("Update installation is not supported in this environment.");
    this.name = "UpdateNotSupportedError";
  }
}

export class InstallerNotReadyError extends Error {
  constructor() {
    super("The installer has not finished downloading yet.");
    this.name = "InstallerNotReadyError";
  }
}

export type UpdateDownloadState =
  | { state: "idle" }
  | { state: "downloading"; progress: number }
  | { state: "downloaded"; installerPath: string }
  | { state: "error"; message: string };

export interface UpdateStatus {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  installSupported: boolean;
  releaseUrl: string | null;
  download: UpdateDownloadState;
  obsPluginAvailable: boolean;
  obsPluginDownload: UpdateDownloadState;
}

export interface UpdateInstallCapability {
  downloadDirectory: string;
  launchInstaller: (installerPath: string) => void;
  launchObsPluginInstaller?: (installerPath: string) => void;
}

export interface UpdateManagerOptions {
  currentVersion: string;
  repo?: string;
  checkIntervalMs?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
  install?: UpdateInstallCapability;
}

const DEFAULT_REPO = "kurokoji/myogi-ban";
const DEFAULT_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export class UpdateManager {
  private readonly currentVersion: string;
  private readonly repo: string;
  private readonly checkIntervalMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly installCapability?: UpdateInstallCapability;

  private lastCheckedAt = -Infinity;
  private latestVersion: string | null = null;
  private releaseUrl: string | null = null;
  private assetUrl: string | null = null;
  private assetName: string | null = null;
  private download: UpdateDownloadState = { state: "idle" };
  private downloading = false;
  private obsPluginAssetUrl: string | null = null;
  private obsPluginAssetName: string | null = null;
  private obsPluginDownload: UpdateDownloadState = { state: "idle" };
  private obsPluginDownloading = false;

  constructor(options: UpdateManagerOptions) {
    this.currentVersion = options.currentVersion;
    this.repo = options.repo ?? DEFAULT_REPO;
    this.checkIntervalMs = options.checkIntervalMs ?? DEFAULT_CHECK_INTERVAL_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => Date.now());
    this.installCapability = options.install;
  }

  async getStatus(): Promise<UpdateStatus> {
    if (this.now() - this.lastCheckedAt >= this.checkIntervalMs) {
      await this.check();
    }
    return this.buildStatus();
  }

  async checkNow(): Promise<UpdateStatus> {
    await this.check();
    return this.buildStatus();
  }

  private buildStatus(): UpdateStatus {
    const updateAvailable =
      this.latestVersion !== null &&
      isNewerVersion(this.currentVersion, this.latestVersion);
    return {
      currentVersion: this.currentVersion,
      latestVersion: this.latestVersion,
      updateAvailable,
      installSupported: this.installCapability !== undefined,
      releaseUrl: this.releaseUrl,
      download: this.download,
      obsPluginAvailable:
        this.obsPluginAssetUrl !== null && this.obsPluginAssetName !== null,
      obsPluginDownload: this.obsPluginDownload,
    };
  }

  private async check(): Promise<void> {
    this.lastCheckedAt = this.now();
    try {
      const response = await this.fetchImpl(
        `https://api.github.com/repos/${this.repo}/releases/latest`,
      );
      if (!response.ok) return;
      const release = parseLatestRelease(await response.json());
      if (!release) return;
      this.latestVersion = release.version;
      this.releaseUrl = `https://github.com/${this.repo}/releases/tag/${release.tagName}`;
      this.assetUrl = release.assetUrl;
      this.assetName = release.assetName;
      this.obsPluginAssetUrl = release.obsPluginAssetUrl;
      this.obsPluginAssetName = release.obsPluginAssetName;
    } catch {
      // A failed check leaves the previously known status in place.
    }
  }

  async startDownload(): Promise<void> {
    if (!this.installCapability) return;
    if (this.downloading) return;
    const updateAvailable =
      this.latestVersion !== null &&
      isNewerVersion(this.currentVersion, this.latestVersion);
    if (!updateAvailable || !this.assetUrl || !this.assetName) return;

    this.downloading = true;
    const destination = join(
      this.installCapability.downloadDirectory,
      this.assetName,
    );
    this.download = { state: "downloading", progress: 0 };
    try {
      await this.downloadTo(this.assetUrl, destination, (state) => {
        this.download = state;
      });
      this.download = { state: "downloaded", installerPath: destination };
    } catch (error) {
      if (existsSync(destination)) unlinkSync(destination);
      this.download = {
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      this.downloading = false;
    }
  }

  private async downloadTo(
    url: string,
    destination: string,
    onProgress: (state: UpdateDownloadState) => void,
  ): Promise<void> {
    const response = await this.fetchImpl(url);
    if (!response.ok || !response.body) {
      throw new Error(
        `Failed to download the installer (status ${response.status}).`,
      );
    }
    const total = Number(response.headers.get("content-length")) || 0;
    let received = 0;
    const fileStream = createWriteStream(destination);
    try {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
        received += chunk.length;
        if (total > 0) {
          onProgress({ state: "downloading", progress: received / total });
        }
        await new Promise<void>((resolve, reject) => {
          fileStream.write(chunk, (error) =>
            error ? reject(error) : resolve(),
          );
        });
      }
    } finally {
      await new Promise<void>((resolve, reject) => {
        fileStream.end((error: unknown) => (error ? reject(error) : resolve()));
      });
    }
  }

  install(): void {
    if (!this.installCapability) throw new UpdateNotSupportedError();
    if (this.download.state !== "downloaded") {
      throw new InstallerNotReadyError();
    }
    this.installCapability.launchInstaller(this.download.installerPath);
  }

  async startObsPluginDownload(): Promise<void> {
    if (!this.installCapability?.launchObsPluginInstaller) return;
    if (this.obsPluginDownloading) return;
    if (!this.obsPluginAssetUrl || !this.obsPluginAssetName) return;

    this.obsPluginDownloading = true;
    const destination = join(
      this.installCapability.downloadDirectory,
      this.obsPluginAssetName,
    );
    this.obsPluginDownload = { state: "downloading", progress: 0 };
    try {
      await this.downloadTo(this.obsPluginAssetUrl, destination, (state) => {
        this.obsPluginDownload = state;
      });
      this.obsPluginDownload = {
        state: "downloaded",
        installerPath: destination,
      };
    } catch (error) {
      if (existsSync(destination)) unlinkSync(destination);
      this.obsPluginDownload = {
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      this.obsPluginDownloading = false;
    }
  }

  installObsPlugin(): void {
    if (!this.installCapability?.launchObsPluginInstaller) {
      throw new UpdateNotSupportedError();
    }
    if (this.obsPluginDownload.state !== "downloaded") {
      throw new InstallerNotReadyError();
    }
    this.installCapability.launchObsPluginInstaller(
      this.obsPluginDownload.installerPath,
    );
  }
}
