export interface LatestReleaseInfo {
  version: string;
  tagName: string;
  assetName: string;
  assetUrl: string;
}

export function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);
  const length = Math.max(currentParts.length, latestParts.length);
  for (let i = 0; i < length; i++) {
    const currentPart = currentParts[i] ?? 0;
    const latestPart = latestParts[i] ?? 0;
    if (latestPart !== currentPart) return latestPart > currentPart;
  }
  return false;
}

export function resolveInstallerAssetName(version: string): string {
  return `Myogi Ban Setup ${version}.exe`;
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseLatestRelease(payload: unknown): LatestReleaseInfo | null {
  if (!record(payload)) return null;
  if (typeof payload.tag_name !== "string") return null;
  if (!Array.isArray(payload.assets)) return null;

  const tagName = payload.tag_name;
  const version = tagName.replace(/^v/, "");
  const assetName = resolveInstallerAssetName(version);
  const asset = payload.assets.find(
    (candidate): candidate is Record<string, unknown> =>
      record(candidate) && candidate.name === assetName,
  );
  if (!asset || typeof asset.browser_download_url !== "string") return null;

  return { version, tagName, assetName, assetUrl: asset.browser_download_url };
}
