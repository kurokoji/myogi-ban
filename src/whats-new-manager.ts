import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { resolveWhatsNewState } from "./whats-new";

export interface WhatsNewStatus {
  show: boolean;
  version: string;
  notes: string | null;
  releaseUrl: string;
}

export interface ReleaseNotes {
  version: string;
  notes: string | null;
  releaseUrl: string;
}

export interface WhatsNewManagerOptions {
  currentVersion: string;
  stateFile: string;
  repo?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_REPO = "kurokoji/myogi-ban";

export class WhatsNewManager {
  private readonly currentVersion: string;
  private readonly stateFile: string;
  private readonly repo: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: WhatsNewManagerOptions) {
    this.currentVersion = options.currentVersion;
    this.stateFile = options.stateFile;
    this.repo = options.repo ?? DEFAULT_REPO;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getStatus(): Promise<WhatsNewStatus> {
    const lastSeenVersion = this.readLastSeenVersion();
    const { show, version } = resolveWhatsNewState(
      lastSeenVersion,
      this.currentVersion,
    );
    const notes = show ? await this.fetchReleaseNotes(version) : null;
    this.writeLastSeenVersion(version);
    return { show, version, notes, releaseUrl: this.releaseUrl(version) };
  }

  async getCurrentReleaseNotes(): Promise<ReleaseNotes> {
    const version = this.currentVersion;
    const notes = await this.fetchReleaseNotes(version);
    return { version, notes, releaseUrl: this.releaseUrl(version) };
  }

  private releaseUrl(version: string): string {
    return `https://github.com/${this.repo}/releases/tag/v${version}`;
  }

  private readLastSeenVersion(): string | null {
    try {
      const data = JSON.parse(readFileSync(this.stateFile, "utf8"));
      return typeof data.lastSeenVersion === "string"
        ? data.lastSeenVersion
        : null;
    } catch {
      return null;
    }
  }

  private writeLastSeenVersion(version: string): void {
    try {
      mkdirSync(dirname(this.stateFile), { recursive: true });
      writeFileSync(
        this.stateFile,
        JSON.stringify({ lastSeenVersion: version }),
      );
    } catch {
      // Best-effort persistence; a failed write just risks showing this again.
    }
  }

  private async fetchReleaseNotes(version: string): Promise<string | null> {
    try {
      const response = await this.fetchImpl(
        `https://api.github.com/repos/${this.repo}/releases/tags/v${version}`,
      );
      if (!response.ok) return null;
      const payload = (await response.json()) as { body?: unknown };
      return typeof payload.body === "string" && payload.body.trim() !== ""
        ? payload.body
        : null;
    } catch {
      return null;
    }
  }
}
