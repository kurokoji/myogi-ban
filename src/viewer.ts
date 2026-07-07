import { Layout, GamepadState, STICK_NAMES, SERVER_URL } from './types';
import { Renderer } from './renderer';
import { GamepadManager } from './gamepad';
import { ApiClient } from './api';
import { createDefaultLayout, ensureLayoutDefaults } from './layout';

class ViewerApp {
  private gamepad: GamepadManager;
  private api: ApiClient;
  private renderer: Renderer;
  private layout: Layout;
  private buttonMappings: number[];
  private stickMappings: number[];

  constructor() {
    this.gamepad = new GamepadManager();
    this.api = new ApiClient();
    this.layout = createDefaultLayout();
    this.renderer = new Renderer(this.layout);
    this.buttonMappings = GamepadManager.createDefaultButtonMappings();
    this.stickMappings = GamepadManager.createDefaultStickMappings();
    this.setupGamepadListeners();
    this.loadDefaultLayout();
    this.startPolling();
  }

  private setupGamepadListeners(): void {
    this.gamepad.onConnect(() => {
      this.renderer.showGamepadArea(true);
    });

    this.gamepad.onDisconnect(() => {
      this.renderer.showGamepadArea(false);
    });
  }

  private async loadDefaultLayout(): Promise<void> {
    try {
      const data = await this.api.getLayout('default');
      if (data && data.version) {
        this.layout = ensureLayoutDefaults(data);
        // マッピング情報を読み込む
        if (data.buttonMappings) {
          this.buttonMappings = data.buttonMappings;
        }
        if (data.stickMappings) {
          this.stickMappings = data.stickMappings;
        }
        this.renderer.updateLayout(this.layout);
      } else {
        this.renderer.updateLayout(this.layout);
      }
    } catch {
      this.renderer.updateLayout(this.layout);
    }
  }

  private startPolling(): void {
    setInterval(() => this.gamepad.pollConnection(), 100);
    requestAnimationFrame(() => this.updateLoop());
  }

  private updateLoop(): void {
    const gamepad = this.gamepad.getGamepad();
    if (gamepad) {
      this.updateGamepadState(gamepad);
    }
    requestAnimationFrame(() => this.updateLoop());
  }

  private updateGamepadState(gamepad: Gamepad): void {
    let stickClass = 'stick';
    const stickStatus = [false, false, false, false];

    for (let i = 0; i < 4; i++) {
      if (this.gamepad.isButtonPressed(this.stickMappings[i], gamepad)) {
        stickClass += ` ${STICK_NAMES[i]}`;
        stickStatus[i] = true;
      }
    }
    this.renderer.updateStick(stickClass);

    const inputs: number[] = [];
    let statusChanged = false;

    for (let i = 0; i < this.layout.totalbuttonshow; i++) {
      const pressed = this.gamepad.isButtonPressed(this.buttonMappings[i], gamepad);
      this.renderer.updateButton(i, pressed);
      if (pressed) {
        inputs.push(i);
        statusChanged = true;
      }
    }

    // Input history
    if (this.layout.inputhistorymode.toggle && statusChanged) {
      let d = 0;
      if (stickStatus[0] && stickStatus[2]) d = 1005;
      else if (stickStatus[1] && stickStatus[2]) d = 1006;
      else if (stickStatus[0] && stickStatus[3]) d = 1007;
      else if (stickStatus[1] && stickStatus[3]) d = 1008;
      else if (stickStatus[0]) d = 1001;
      else if (stickStatus[1]) d = 1002;
      else if (stickStatus[2]) d = 1003;
      else if (stickStatus[3]) d = 1004;

      if (d > 0) inputs.push(d);
      this.renderer.addInputHistoryEntry(inputs);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ViewerApp();
});
