import { Layout, GamepadState, STICK_NAMES, TOTAL_BUTTONS, SERVER_URL } from './types';
import { GamepadManager, ButtonMapping, StickMapping } from './gamepad';
import { ApiClient } from './api';
import { Renderer } from './renderer';
import { createDefaultLayout, ensureLayoutDefaults } from './layout';
import { $id } from './dom';

class EditorApp {
  private gamepad: GamepadManager;
  private api: ApiClient;
  private renderer: Renderer;
  private layout: Layout;
  private buttonMappings: ButtonMapping[];
  private stickMappings: StickMapping[];
  private assigningTarget: number | null = null; // 0-51: button, 1000-1003: stick
  private axisHoldCounter = 0;
  private axisHoldTarget: { axis: number; value: number } | null = null;

  constructor() {
    this.gamepad = new GamepadManager();
    this.api = new ApiClient();
    this.layout = createDefaultLayout();
    this.renderer = new Renderer(this.layout, {
      onBackgroundSizeChange: (width, height) => this.updateBackgroundSize(width, height)
    });
    this.buttonMappings = GamepadManager.createDefaultButtonMappings();
    this.stickMappings = GamepadManager.createDefaultStickMappings();
    this.setupEventListeners();
    this.setupGamepadListeners();
    this.loadLayoutList();
    this.loadDefaultLayout();
    this.startPolling();
  }

  private setupEventListeners(): void {
    // Display controls
    $id('scalevalue')?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      $id('scaletext')!.textContent = val.toFixed(1);
      const container = $id('preview-container');
      if (container) {
        container.style.transform = `scale(${val})`;
        container.style.transformOrigin = 'top left';
      }
    });

    $id('bgopacityvalue')?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      $id('opacitytext')!.textContent = val.toFixed(1);
      const bg = $id('gamepad-area-background');
      if (bg) bg.style.opacity = val.toString();
    });

    // Stick controls
    $id('showstick')?.addEventListener('change', (e) => {
      this.layout.showstick = (e.target as HTMLInputElement).checked;
      this.renderer.renderStick();
    });

    ['stickx', 'sticky', 'stickw', 'stickh'].forEach((id) => {
      $id(id)?.addEventListener('input', (e) => {
        const key = id.replace('stick', '') as 'x' | 'y' | 'w' | 'h';
        this.layout.stick[key] = (e.target as HTMLInputElement).value;
        this.renderer.renderStick();
      });
    });

    // Button controls
    $id('buttoncount')?.addEventListener('input', (e) => {
      const count = parseInt((e.target as HTMLInputElement).value);
      this.layout.totalbuttonshow = Math.max(0, Math.min(48, count));
      this.renderer.renderButtons();
    });

    // Background controls
    $id('showbg')?.addEventListener('change', (e) => {
      this.layout.background.show = (e.target as HTMLInputElement).checked;
      this.renderer.renderBackground();
    });

    $id('bgscale')?.addEventListener('input', (e) => {
      this.layout.background.scale = (e.target as HTMLInputElement).value;
      this.renderer.renderBackground();
    });

    $id('bgimg')?.addEventListener('input', (e) => {
      this.layout.background.image = (e.target as HTMLInputElement).value;
      this.renderer.renderBackground();
    });

    $id('bgimgselect')?.addEventListener('click', () => {
      $id('bgimgfile')?.click();
    });

    $id('bgimgfile')?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const fileName = file.name;
        
        // Upload to server
        try {
          const response = await fetch(`${SERVER_URL}/api/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: dataUrl,
              layoutName: 'custom',
              fileName: fileName
            })
          });

          if (response.ok) {
            this.layout.name = 'custom';
            this.layout.background.image = fileName;
            ($id('bgimg') as HTMLInputElement).value = fileName;
            this.renderer.renderBackground();
          }
        } catch (err) {
          console.error('Failed to upload image:', err);
        }
      };
      reader.readAsDataURL(file);
    });

    // Input history controls
    $id('historytoggle')?.addEventListener('change', (e) => {
      this.layout.inputhistorymode.toggle = (e.target as HTMLInputElement).checked;
      $id('historyoptions')!.classList.toggle('hide', !this.layout.inputhistorymode.toggle);
      this.renderer.renderInputHistory();
    });

    $id('historydir')?.addEventListener('change', (e) => {
      this.layout.inputhistorymode.direction = parseInt((e.target as HTMLInputElement).value);
      this.renderer.renderInputHistory();
    });

    $id('historycount')?.addEventListener('input', (e) => {
      this.layout.inputhistorymode.count = parseInt((e.target as HTMLInputElement).value);
    });

    $id('historygame')?.addEventListener('change', (e) => {
      this.layout.inputhistorymode.game = (e.target as HTMLInputElement).value;
    });

    // Layout controls
    $id('loadlayout')?.addEventListener('click', () => this.loadLayout());
    $id('savelayout')?.addEventListener('click', () => this.saveLayout());
    $id('setdefault')?.addEventListener('click', () => this.setDefaultLayout());

    // Button mapping
    $id('button-area')?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.button');
      if (btn) {
        const index = parseInt(btn.id.replace('button', ''));
        this.startButtonAssignment(index);
      }
    });

    STICK_NAMES.forEach((name, index) => {
      $id(name)?.addEventListener('click', () => {
        this.startStickAssignment(index);
      });
    });

    $id('cancelmapping')?.addEventListener('click', () => this.cancelAssignment());

    // OBS URL copy
    $id('copyurl')?.addEventListener('click', () => {
      navigator.clipboard.writeText(`${SERVER_URL}/view`);
    });
  }

  private setupGamepadListeners(): void {
    this.gamepad.onConnect((gp) => {
      $id('gamepadstatus')!.textContent = `Connected: ${gp.id}`;
      $id('gamepadstatus')!.className = 'status-connected';
      this.renderer.showGamepadArea(true);
    });

    this.gamepad.onDisconnect(() => {
      $id('gamepadstatus')!.textContent = 'Not connected';
      $id('gamepadstatus')!.className = 'status-disconnected';
      this.renderer.showGamepadArea(false);
    });
  }

  private async loadLayoutList(): Promise<void> {
    try {
      const layouts = await this.api.getLayouts();
      const select = $id('layoutselect') as HTMLSelectElement;
      if (!select) return;
      select.innerHTML = '';
      for (const name of layouts) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      }
    } catch (err) {
      console.error('Failed to load layout list:', err);
    }
  }

  private async loadLayout(): Promise<void> {
    const select = $id('layoutselect') as HTMLSelectElement;
    if (!select || !select.value) return;

    try {
      const data = await this.api.getLayout(select.value);
      this.layout = ensureLayoutDefaults(data);
      // マッピング情報を読み込む
      if (data.buttonMappings) {
        this.buttonMappings = data.buttonMappings;
      }
      if (data.stickMappings) {
        this.stickMappings = data.stickMappings;
      }
      this.renderer.updateLayout(this.layout);
      this.syncUIFromLayout();
      ($id('layoutname') as HTMLInputElement).value = select.value;
    } catch (err) {
      console.error('Failed to load layout:', err);
    }
  }

  private async saveLayout(): Promise<void> {
    const name = ($id('layoutname') as HTMLInputElement)?.value || this.layout.name || 'custom';
    this.layout.name = name;
    // マッピング情報をレイアウトに含める
    this.layout.buttonMappings = this.buttonMappings;
    this.layout.stickMappings = this.stickMappings;
    try {
      await this.api.saveLayout(name, this.layout);
      // デフォルトとしても保存
      await this.api.saveLayout('default', this.layout);
      await this.loadLayoutList();
      alert('Saved!');
    } catch (err) {
      console.error('Failed to save layout:', err);
    }
  }

  private async setDefaultLayout(): Promise<void> {
    // マッピング情報をレイアウトに含める
    this.layout.buttonMappings = this.buttonMappings;
    this.layout.stickMappings = this.stickMappings;
    try {
      await this.api.saveLayout('default', this.layout);
      await this.loadLayoutList();
      alert('Set as default layout!');
    } catch (err) {
      console.error('Failed to set default layout:', err);
    }
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
        this.syncUIFromLayout();
      }
    } catch (err) {
      console.log('No default layout found, using built-in default');
    }
  }

  private syncUIFromLayout(): void {
    ($id('showstick') as HTMLInputElement).checked = this.layout.showstick;
    ($id('stickx') as HTMLInputElement).value = this.layout.stick.x;
    ($id('sticky') as HTMLInputElement).value = this.layout.stick.y;
    ($id('stickw') as HTMLInputElement).value = this.layout.stick.w;
    ($id('stickh') as HTMLInputElement).value = this.layout.stick.h;
    ($id('buttoncount') as HTMLInputElement).value = this.layout.totalbuttonshow.toString();
    ($id('showbg') as HTMLInputElement).checked = this.layout.background.show;
    ($id('bgscale') as HTMLInputElement).value = this.layout.background.scale || '1';
    $id('bgw')!.textContent = this.layout.background.w || '500';
    $id('bgh')!.textContent = this.layout.background.h || '250';
    ($id('bgimg') as HTMLInputElement).value = this.layout.background.image;
    ($id('historytoggle') as HTMLInputElement).checked = this.layout.inputhistorymode.toggle;
    $id('historyoptions')!.classList.toggle('hide', !this.layout.inputhistorymode.toggle);
    ($id('historydir') as HTMLSelectElement).value = this.layout.inputhistorymode.direction.toString();
    ($id('historycount') as HTMLInputElement).value = this.layout.inputhistorymode.count.toString();
    ($id('historygame') as HTMLSelectElement).value = this.layout.inputhistorymode.game;
  }

  private updateBackgroundSize(width: number, height: number): void {
    this.layout.background.w = width.toString();
    this.layout.background.h = height.toString();
    const widthText = $id('bgw');
    const heightText = $id('bgh');
    if (widthText) widthText.textContent = this.layout.background.w;
    if (heightText) heightText.textContent = this.layout.background.h;
  }

  private startButtonAssignment(buttonIndex: number): void {
    if (!this.gamepad.isConnected()) {
      alert('Connect a gamepad first');
      return;
    }
    this.assigningTarget = buttonIndex;
    $id('mappingstatus')!.style.display = 'block';
    $id('assigningtarget')!.textContent = `Button ${buttonIndex + 1}`;
    this.axisHoldCounter = 0;
    this.axisHoldTarget = null;
  }

  private startStickAssignment(dirIndex: number): void {
    if (!this.gamepad.isConnected()) {
      alert('Connect a gamepad first');
      return;
    }
    this.assigningTarget = 1000 + dirIndex;
    const dirNames = ['Up', 'Down', 'Left', 'Right'];
    $id('mappingstatus')!.style.display = 'block';
    $id('assigningtarget')!.textContent = `Stick ${dirNames[dirIndex]}`;
    this.axisHoldCounter = 0;
    this.axisHoldTarget = null;
  }

  private cancelAssignment(): void {
    this.assigningTarget = null;
    $id('mappingstatus')!.style.display = 'none';
  }

  private completeAssignment(code: number): void {
    if (this.assigningTarget === null) return;

    if (this.assigningTarget < 1000) {
      this.buttonMappings[this.assigningTarget] = code;
      console.log(`Button ${this.assigningTarget + 1} assigned to code ${code}`);
    } else {
      const dirIndex = this.assigningTarget - 1000;
      this.stickMappings[dirIndex] = code;
      console.log(`Stick direction ${dirIndex} assigned to code ${code}`);
    }
    this.cancelAssignment();
  }

  private startPolling(): void {
    setInterval(() => this.gamepad.pollConnection(), 100);
    requestAnimationFrame(() => this.updateLoop());
  }

  private updateLoop(): void {
    const gamepad = this.gamepad.getGamepad();
    if (gamepad) {
      // Button assignment mode
      if (this.assigningTarget !== null) {
        const buttonPress = this.gamepad.detectButtonPress();
        if (buttonPress !== null) {
          this.completeAssignment(buttonPress);
        } else {
          const axisHold = this.gamepad.detectAxisHold();
          if (axisHold) {
            if (this.axisHoldTarget &&
                this.axisHoldTarget.axis === axisHold.axis &&
                Math.abs(this.axisHoldTarget.value - axisHold.value) < 0.1) {
              this.axisHoldCounter++;
              if (this.axisHoldCounter >= 60) {
                const code = GamepadManager.axisToCode(axisHold.axis, axisHold.value);
                this.completeAssignment(code);
              }
            } else {
              this.axisHoldTarget = axisHold;
              this.axisHoldCounter = 1;
            }
          } else {
            this.axisHoldCounter = 0;
            this.axisHoldTarget = null;
          }
        }
      } else {
        // Normal update mode
        this.updateGamepadState(gamepad);
      }
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
      const dpadStatus = [false, false, false, false];
      for (let i = 0; i < 4; i++) {
        dpadStatus[i] = stickStatus[i];
      }

      let d = 0;
      if (dpadStatus[0] && dpadStatus[2]) d = 1005;
      else if (dpadStatus[1] && dpadStatus[2]) d = 1006;
      else if (dpadStatus[0] && dpadStatus[3]) d = 1007;
      else if (dpadStatus[1] && dpadStatus[3]) d = 1008;
      else if (dpadStatus[0]) d = 1001;
      else if (dpadStatus[1]) d = 1002;
      else if (dpadStatus[2]) d = 1003;
      else if (dpadStatus[3]) d = 1004;

      if (d > 0) inputs.push(d);
      this.renderer.addInputHistoryEntry(inputs);
    }

    // Send state to server
    const state: GamepadState = {
      stick: stickClass,
      buttons: Array.from({ length: this.layout.totalbuttonshow }, (_, i) =>
        this.gamepad.isButtonPressed(this.buttonMappings[i], gamepad)
      ),
      input: this.layout.inputhistorymode.toggle ? inputs : [],
      connected: true,
      layout: this.layout
    };
    this.api.sendState(state);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new EditorApp();
});
