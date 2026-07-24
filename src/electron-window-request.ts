interface WindowRequestResponse {
  ok: boolean;
}

type WindowRequestFetch = (
  input: string,
  init: { method: "POST" },
) => Promise<WindowRequestResponse>;

export async function requestRunningWindow(
  port: number,
  request: WindowRequestFetch = fetch,
): Promise<boolean> {
  try {
    const response = await request(`http://127.0.0.1:${port}/api/window/show`, {
      method: "POST",
    });
    return response.ok;
  } catch {
    return false;
  }
}
