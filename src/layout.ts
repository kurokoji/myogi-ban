import { Layout, ButtonLayout, StickLayout, BackgroundConfig, InputHistoryMode, TOTAL_BUTTONS } from './types';

export function createDefaultButtonLayout(overrides: Partial<ButtonLayout> = {}): ButtonLayout {
  return {
    x: '0', y: '0', w: '', h: '', img: '',
    xp: '', yp: '', wp: '', hp: '', imgp: '', useCss: false,
    cssColor: '#cccccc', cssPressedColor: '#999999',
    cssTransition: '0.02', cssEasing: 'ease',
    ...overrides
  };
}

export function createDefaultStickLayout(overrides: Partial<StickLayout> = {}): StickLayout {
  return { x: '0', y: '0', w: '', h: '', ...overrides };
}

export function createDefaultBackgroundConfig(overrides: Partial<BackgroundConfig> = {}): BackgroundConfig {
  return { show: true, image: '', scale: '1', w: '', h: '', ...overrides };
}

export function createDefaultInputHistoryMode(overrides: Partial<InputHistoryMode> = {}): InputHistoryMode {
  return {
    toggle: false,
    direction: 0,
    count: 20,
    game: 'default',
    btnmapping: ['1', '2', '3', '4', ...Array(16).fill('0')],
    ...overrides
  };
}

export function createDefaultLayout(): Layout {
  const buttons: ButtonLayout[] = [
    createDefaultButtonLayout({ x: '250', y: '115' }),
    createDefaultButtonLayout({ x: '310', y: '85' }),
    createDefaultButtonLayout({ x: '375', y: '85' }),
    createDefaultButtonLayout({ x: '440', y: '85' }),
    createDefaultButtonLayout({ x: '240', y: '185' }),
    createDefaultButtonLayout({ x: '300', y: '155' }),
    createDefaultButtonLayout({ x: '365', y: '155' }),
    createDefaultButtonLayout({ x: '430', y: '155' }),
    createDefaultButtonLayout({ x: '390', y: '30', w: '40', h: '40' }),
    createDefaultButtonLayout({ x: '440', y: '30', w: '40', h: '40' }),
  ];

  for (let i = buttons.length; i < TOTAL_BUTTONS; i++) {
    buttons.push(createDefaultButtonLayout());
  }

  return {
    version: '210124',
    name: 'preset',
    inputhistorymode: createDefaultInputHistoryMode(),
    totalbuttonshow: 10,
    showstick: true,
    stick: createDefaultStickLayout({ x: '110', y: '125', w: '100', h: '100' }),
    defaultbuttons: createDefaultButtonLayout({
      w: '60', h: '60',
      img: 'button-released.png',
      imgp: 'button-pressed.png'
    }),
    buttons,
    background: createDefaultBackgroundConfig()
  };
}

export function ensureLayoutDefaults(layout: Partial<Layout>): Layout {
  const defaults = createDefaultLayout();
  const incomingBackground = layout.background as Partial<BackgroundConfig> | undefined;
  const background = { ...defaults.background, ...(incomingBackground || {}) };
  if (incomingBackground && !('scale' in incomingBackground) && (incomingBackground.w || incomingBackground.h)) {
    background.scale = '';
  }
  const incomingDefaultButtons = layout.defaultbuttons as Partial<ButtonLayout> | undefined;
  const defaultbuttons = { ...defaults.defaultbuttons, ...(incomingDefaultButtons || {}) };
  
  const buttons = (layout.buttons || defaults.buttons).map((button) => {
    const b = { ...button };
    if (b.w === defaultbuttons.w) b.w = '';
    if (b.h === defaultbuttons.h) b.h = '';
    if (b.img === defaultbuttons.img) b.img = '';
    if (b.imgp === defaultbuttons.imgp) b.imgp = '';
    return b;
  });
  
  return {
    ...defaults,
    ...layout,
    inputhistorymode: { ...defaults.inputhistorymode, ...(layout.inputhistorymode || {}) },
    stick: { ...defaults.stick, ...(layout.stick || {}) },
    defaultbuttons,
    background,
    buttons,
  };
}
