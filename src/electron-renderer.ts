interface ElectronRendererOptions {
  development: boolean;
  serverPort: number;
}

export function resolveElectronRendererUrl(
  options: ElectronRendererOptions,
): string {
  const port = options.development ? 5173 : options.serverPort;
  return `http://localhost:${port}`;
}
