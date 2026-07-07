import { Layout, GamepadState, SERVER_URL } from './types';

export class ApiClient {
  async getLayouts(): Promise<string[]> {
    const res = await fetch(`${SERVER_URL}/api/layouts`);
    return res.json();
  }

  async getLayout(name: string): Promise<Layout> {
    const res = await fetch(`${SERVER_URL}/api/layout/${name}`);
    return res.json();
  }

  async saveLayout(name: string, data: Layout): Promise<void> {
    await fetch(`${SERVER_URL}/api/layout/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data })
    });
  }

  async sendState(state: GamepadState): Promise<void> {
    try {
      await fetch(`${SERVER_URL}/api/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    } catch {
      // ignore errors
    }
  }
}
