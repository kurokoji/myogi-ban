import { Layout, STICK_NAMES, TOTAL_BUTTONS } from './types';
import { setStyle, removeStyle, addClass, removeClass } from './dom';

export class Renderer {
  private layout: Layout;
  private backgroundImageSize: { key: string; width: number; height: number } | null = null;
  private onBackgroundSizeChange?: (width: number, height: number) => void;

  constructor(layout: Layout, options: { onBackgroundSizeChange?: (width: number, height: number) => void } = {}) {
    this.layout = layout;
    this.onBackgroundSizeChange = options.onBackgroundSizeChange;
  }

  updateLayout(layout: Layout): void {
    this.layout = layout;
    this.renderBackground();
    this.renderStick();
    this.renderButtons();
    this.renderInputHistory();
  }

  renderBackground(): void {
    const bg = this.layout.background;
    if (!bg) {
      removeStyle('background-style');
      return;
    }

    const imageUrl = bg.image ? `layout/${this.layout.name}/${bg.image}` : '';
    const imageKey = imageUrl;
    if (imageUrl && this.backgroundImageSize?.key !== imageKey) {
      const img = new Image();
      img.onload = () => {
        this.backgroundImageSize = { key: imageKey, width: img.naturalWidth, height: img.naturalHeight };
        this.renderBackground();
      };
      img.src = imageUrl;
    } else if (!imageUrl) {
      this.backgroundImageSize = null;
    }

    const naturalWidth = this.backgroundImageSize?.width;
    const naturalHeight = this.backgroundImageSize?.height;
    const legacyWidth = bg.w ? parseFloat(bg.w) : 500;
    const legacyHeight = bg.h ? parseFloat(bg.h) : 250;
    const hasExplicitScale = bg.scale !== undefined && bg.scale !== '';
    const scale = hasExplicitScale
      ? Math.max(0.1, parseFloat(bg.scale) || 1)
      : naturalWidth && bg.w
        ? Math.max(0.1, parseFloat(bg.w) / naturalWidth)
        : naturalHeight && bg.h
          ? Math.max(0.1, parseFloat(bg.h) / naturalHeight)
          : 1;
    const width = Math.round((naturalWidth || legacyWidth) * scale);
    const height = Math.round((naturalHeight || legacyHeight) * scale);

    let css = '#gamepad-area-background{';
    css += bg.show === false ? 'visibility:hidden;' : '';
    css += imageUrl ? `background-image:url("${imageUrl}");` : '';
    css += `width:${width}px;`;
    css += `height:${height}px;`;
    css += '}';
    css += `#gamepad-area{width:${width}px;height:${height}px;}`;
    css += `.gamepad-disconnected{width:${width}px;height:${height}px;}`;
    setStyle('background-style', css);
    this.onBackgroundSizeChange?.(width, height);
  }

  renderStick(): void {
    const stick = this.layout.stick;
    const l = stick.x ? `left:${stick.x}px;` : '';
    const t = stick.y ? `top:${stick.y}px;` : '';
    const w = stick.w ? parseFloat(stick.w) / 100 : 1;
    const h = stick.h ? parseFloat(stick.h) / 100 : 1;

    setStyle('stick-style', `.stick-area{${l}${t}transform:translate(-50%,-50%) scale(${w},${h});}`);

    const stickArea = document.getElementById('stick-area');
    if (stickArea) {
      stickArea.style.display = this.layout.showstick ? '' : 'none';
    }
  }

  renderButtons(): void {
    const btnArea = document.getElementById('button-area');
    if (!btnArea) return;

    while (btnArea.childElementCount > this.layout.totalbuttonshow) {
      btnArea.removeChild(btnArea.lastChild!);
    }
    for (let i = btnArea.childElementCount; i < this.layout.totalbuttonshow; i++) {
      const btn = document.createElement('div');
      btn.id = `button${i}`;
      btn.className = `button button-released button${i}`;
      btnArea.appendChild(btn);
    }

    let css = '';
    const def = this.layout.defaultbuttons;
    const defImg = def.img ? `background-image:url("layout/${this.layout.name}/${def.img}");` : '';
    const defImgP = def.imgp ? `background-image:url("layout/${this.layout.name}/${def.imgp}");` : '';

    for (let i = 0; i < this.layout.totalbuttonshow; i++) {
      const val = this.layout.buttons[i] || {};
      const x = val.x || '';
      const y = val.y || '';
      const w = val.w || def.w || '';
      const h = val.h || def.h || '';
      const img = val.img || def.img || '';
      const xp = val.xp || def.xp || '';
      const yp = val.yp || def.yp || '';
      const wp = val.wp || def.wp || '';
      const hp = val.hp || def.hp || '';
      const imgp = val.imgp || def.imgp || '';

      css += `.button${i}{`;
      if (x) css += `left:${x}px;`;
      if (y) css += `top:${y}px;`;
      if (w) css += `width:${w}px;`;
      if (h) css += `height:${h}px;`;
      css += '}';

      css += `.button-released.button${i}{`;
      css += img ? `background-image:url("layout/${this.layout.name}/${img}");` : defImg;
      css += '}';

      css += `.button-pressed.button${i}{`;
      if (xp) css += `left:${xp}px;`;
      if (yp) css += `top:${yp}px;`;
      if (wp) css += `width:${wp}px;`;
      if (hp) css += `height:${hp}px;`;
      css += imgp ? `background-image:url("layout/${this.layout.name}/${imgp}");` : defImgP;
      css += '}';
    }
    setStyle('button-style', css);
  }

  renderInputHistory(): void {
    const inputList = document.getElementById('inputlist');
    if (!inputList) return;

    if (this.layout.inputhistorymode.toggle) {
      inputList.classList.remove('hide');
      inputList.classList.remove('horizontal', 'up');
      if (this.layout.inputhistorymode.direction === 1) {
        inputList.classList.add('horizontal');
      } else if (this.layout.inputhistorymode.direction === 2) {
        inputList.classList.add('horizontal', 'up');
      }
    } else {
      inputList.classList.add('hide');
    }
  }

  updateStick(stickClass: string): void {
    const stick = document.getElementById('stick');
    if (stick) stick.className = stickClass;
  }

  updateButton(index: number, pressed: boolean): void {
    const btn = document.getElementById(`button${index}`);
    if (!btn) return;
    if (pressed) {
      btn.classList.remove('button-released');
      btn.classList.add('button-pressed');
    } else {
      btn.classList.remove('button-pressed');
      btn.classList.add('button-released');
    }
  }

  showGamepadArea(show: boolean): void {
    const bgImage = document.getElementById('gamepad-background-image');
    if (!bgImage) return;
    if (show) {
      addClass(bgImage, 'gamepad-connected');
    } else {
      removeClass(bgImage, 'gamepad-connected');
    }
  }

  addInputHistoryEntry(inputs: number[]): void {
    if (!this.layout.inputhistorymode.toggle) return;
    if (inputs.length === 0) return;

    const parent = document.getElementById('inputlist');
    if (!parent) return;

    while (parent.childElementCount >= this.layout.inputhistorymode.count) {
      parent.removeChild(parent.lastChild!);
    }

    const child = document.createElement('div');
    child.className = 'inputlistchild';
    if (this.layout.inputhistorymode.game === 'combination') {
      child.className += ' combination';
    }

    const childAlign = document.createElement('div');
    childAlign.className = 'inputlistchildalign';
    child.appendChild(childAlign);

    for (const inp of inputs) {
      const ele = document.createElement('div');
      const isArrow = inp >= 1000 && inp < 2000;
      const displayInp = inp < 999 ? inp + 1 : inp;
      ele.className = `inputlistelement inputlistelement${displayInp}${isArrow ? ' inputarrow' : ''}`;
      childAlign.appendChild(ele);
    }

    parent.insertBefore(child, parent.firstChild);
  }
}
