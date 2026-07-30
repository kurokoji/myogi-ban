export interface WhatsNewState {
  show: boolean;
  version: string;
}

export function resolveWhatsNewState(
  lastSeenVersion: string | null,
  currentVersion: string,
): WhatsNewState {
  return {
    show: lastSeenVersion !== null && lastSeenVersion !== currentVersion,
    version: currentVersion,
  };
}
