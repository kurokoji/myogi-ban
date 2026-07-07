import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ActionIcon,
  Button,
  Group,
  MantineProvider,
  NativeSelect,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import './i18n';
import i18n from './i18n';
import { ApiClient } from './api';
import { GamepadManager, ButtonMapping, StickMapping } from './gamepad';
import { createDefaultLayout, ensureLayoutDefaults } from './layout';
import { GamepadState, Layout, SERVER_URL } from './types';
import { createEmptySnapshot, readGamepadSnapshot } from './gamepad-state';
import { GamepadView } from './components/GamepadView';

type AssigningTarget = number | null;
type ImageUploadTarget =
  | { type: 'background' }
  | { type: 'defaultButton'; state: 'released' | 'pressed' }
  | { type: 'button'; index: number; state: 'released' | 'pressed' };

function cloneLayout(layout: Layout): Layout {
  return {
    ...layout,
    stick: { ...layout.stick },
    defaultbuttons: { ...layout.defaultbuttons },
    background: { ...layout.background },
    buttons: layout.buttons.map((button) => ({ ...button })),
    buttonMappings: layout.buttonMappings ? [...layout.buttonMappings] : undefined,
    stickMappings: layout.stickMappings ? [...layout.stickMappings] : undefined
  };
}

function numberInputValue(value: string | number): string {
  return value === undefined || value === null ? '' : String(value);
}

function numericValue(value: string | number): number | string {
  const text = numberInputValue(value);
  return text === '' ? '' : Number(text);
}

function useLatestRef<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

function EditorApp(): React.ReactElement {
  const { t } = useTranslation();
  const apiRef = useRef(new ApiClient());
  const gamepadRef = useRef<GamepadManager | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadTargetRef = useRef<ImageUploadTarget>({ type: 'background' });
  const [layout, setLayout] = useState<Layout>(() => createDefaultLayout());
  const [layoutNames, setLayoutNames] = useState<string[]>([]);
  const [selectedLayout, setSelectedLayout] = useState('');
  const [layoutName, setLayoutName] = useState('mypreset');
  const [buttonMappings, setButtonMappings] = useState<ButtonMapping[]>(() => GamepadManager.createDefaultButtonMappings());
  const [stickMappings, setStickMappings] = useState<StickMapping[]>(() => GamepadManager.createDefaultStickMappings());
  const [connected, setConnected] = useState(false);
  const [gamepadName, setGamepadName] = useState('');
  const [snapshot, setSnapshot] = useState(() => createEmptySnapshot(createDefaultLayout()));
  const [previewScale, setPreviewScale] = useState(1);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const [assigningTarget, setAssigningTarget] = useState<AssigningTarget>(null);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(null);
  const [language, setLanguage] = useState(i18n.language);
  const axisHoldCounterRef = useRef(0);
  const axisHoldTargetRef = useRef<{ axis: number; value: number } | null>(null);
  const layoutRef = useLatestRef(layout);
  const buttonMappingsRef = useLatestRef(buttonMappings);
  const stickMappingsRef = useLatestRef(stickMappings);
  const assigningTargetRef = useLatestRef(assigningTarget);

  const obsUrl = `${SERVER_URL}/view`;
  const assignmentName = useMemo(() => {
    if (assigningTarget === null) return '';
    if (assigningTarget < 1000) return `Button ${assigningTarget + 1}`;
    return `Stick ${['Up', 'Down', 'Left', 'Right'][assigningTarget - 1000]}`;
  }, [assigningTarget]);

  const refreshLayouts = useCallback(async () => {
    try {
      const layouts = await apiRef.current.getLayouts();
      setLayoutNames(layouts);
    } catch (error) {
      console.error('Failed to load layout list:', error);
    }
  }, []);

  const applyLayout = useCallback((data: Layout, name?: string) => {
    const nextLayout = ensureLayoutDefaults(data);
    setLayout(nextLayout);
    setSnapshot(createEmptySnapshot(nextLayout));
    setButtonMappings(data.buttonMappings || GamepadManager.createDefaultButtonMappings());
    setStickMappings(data.stickMappings || GamepadManager.createDefaultStickMappings());
    if (name) setLayoutName(name);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadDefaultLayout = async () => {
      try {
        const defaultLayout = await apiRef.current.getDefaultLayout();
        const layoutName = defaultLayout.name || 'preset';
        const data = await apiRef.current.getLayout(layoutName);
        if (!cancelled && data) {
          applyLayout(data, layoutName);
          setSelectedLayout(layoutName);
        }
        await refreshLayouts();
      } catch {
        console.log('No default layout found, using built-in default');
        await refreshLayouts();
      }
    };
    loadDefaultLayout();
    return () => {
      cancelled = true;
    };
  }, [applyLayout, refreshLayouts]);

  useEffect(() => {
    setSelectedButtonIndex((current) => {
      if (current === null) return null;
      return Math.min(current, Math.max(0, layout.totalbuttonshow - 1));
    });
  }, [layout.totalbuttonshow]);

  useEffect(() => {
    const manager = new GamepadManager();
    gamepadRef.current = manager;
    manager.onConnect((gamepad) => {
      setConnected(true);
      setGamepadName(gamepad.id);
    });
    manager.onDisconnect(() => {
      setConnected(false);
      setGamepadName('');
      setSnapshot(createEmptySnapshot(layoutRef.current));
    });

    const pollTimer = window.setInterval(() => manager.pollConnection(), 100);
    let frame = 0;
    const updateLoop = () => {
      const gamepad = manager.getGamepad();
      if (gamepad) {
        const target = assigningTargetRef.current;
        if (target !== null) {
          const buttonPress = manager.detectButtonPress();
          if (buttonPress !== null) {
            completeAssignment(target, buttonPress);
          } else {
            const axisHold = manager.detectAxisHold();
            if (
              axisHold &&
              axisHoldTargetRef.current &&
              axisHoldTargetRef.current.axis === axisHold.axis &&
              Math.abs(axisHoldTargetRef.current.value - axisHold.value) < 0.1
            ) {
              axisHoldCounterRef.current += 1;
              if (axisHoldCounterRef.current >= 60) {
                completeAssignment(target, GamepadManager.axisToCode(axisHold.axis, axisHold.value));
              }
            } else if (axisHold) {
              axisHoldTargetRef.current = axisHold;
              axisHoldCounterRef.current = 1;
            } else {
              axisHoldTargetRef.current = null;
              axisHoldCounterRef.current = 0;
            }
          }
        } else {
          const nextSnapshot = readGamepadSnapshot(
            manager,
            gamepad,
            layoutRef.current,
            buttonMappingsRef.current,
            stickMappingsRef.current
          );
          setSnapshot(nextSnapshot);

          const state: GamepadState = {
            stick: nextSnapshot.stickClass,
            buttons: nextSnapshot.pressedButtons,
            connected: true,
            layout: layoutRef.current
          };
          apiRef.current.sendState(state);
        }
      }
      frame = window.requestAnimationFrame(updateLoop);
    };
    frame = window.requestAnimationFrame(updateLoop);

    return () => {
      window.clearInterval(pollTimer);
      window.cancelAnimationFrame(frame);
    };
  }, [assigningTargetRef, buttonMappingsRef, layoutRef, stickMappingsRef]);

  const completeAssignment = useCallback((target: number, code: number) => {
    if (target < 1000) {
      setButtonMappings((current) => {
        const next = [...current];
        next[target] = code;
        return next;
      });
    } else {
      const directionIndex = target - 1000;
      setStickMappings((current) => {
        const next = [...current];
        next[directionIndex] = code;
        return next;
      });
    }
    setAssigningTarget(null);
    axisHoldCounterRef.current = 0;
    axisHoldTargetRef.current = null;
  }, []);

  const updateLayout = useCallback((updater: (layout: Layout) => void) => {
    setLayout((current) => {
      const next = cloneLayout(current);
      updater(next);
      return next;
    });
  }, []);

  const updateBackgroundSize = useCallback((width: number, height: number) => {
    setLayout((current) => {
      if (current.background.w === String(width) && current.background.h === String(height)) return current;
      const next = cloneLayout(current);
      next.background.w = String(width);
      next.background.h = String(height);
      return next;
    });
  }, []);

  const handleButtonPositionChange = useCallback((index: number, x: number, y: number) => {
    setLayout((current) => {
      const next = cloneLayout(current);
      next.buttons[index].x = String(x);
      next.buttons[index].y = String(y);
      return next;
    });
  }, []);

  const handleStickPositionChange = useCallback((x: number, y: number) => {
    setLayout((current) => {
      const next = cloneLayout(current);
      next.stick.x = String(x);
      next.stick.y = String(y);
      return next;
    });
  }, []);

  const loadLayout = async () => {
    if (!selectedLayout) return;
    try {
      const data = await apiRef.current.getLayout(selectedLayout);
      applyLayout(data, selectedLayout);
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  };

  const saveLayout = async () => {
    const name = layoutName || layout.name || 'custom';
    const data = cloneLayout(layout);
    data.name = name;
    data.buttonMappings = buttonMappings;
    data.stickMappings = stickMappings;
    try {
      await apiRef.current.saveLayout(name, data);
      await refreshLayouts();
      window.alert(t('saved'));
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  };

  const setDefaultLayout = async () => {
    const name = layoutName || layout.name || 'custom';
    try {
      await apiRef.current.setDefaultLayout(name);
      window.alert(t('defaultSaved'));
    } catch (error) {
      console.error('Failed to set default layout:', error);
    }
  };

  const openImagePicker = (target: ImageUploadTarget) => {
    imageUploadTargetRef.current = target;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploadLayoutName = layoutName || layout.name || 'custom';
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    try {
      const response = await fetch(`${SERVER_URL}/api/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataUrl, layoutName: uploadLayoutName, fileName: file.name })
      });
      if (response.ok) {
        const result = await response.json();
        const fileName = result.fileName || file.name;
        const target = imageUploadTargetRef.current;
        updateLayout((next) => {
          next.name = uploadLayoutName;
          if (target.type === 'background') {
            next.background.image = fileName;
          } else if (target.type === 'defaultButton') {
            next.defaultbuttons[target.state === 'pressed' ? 'imgp' : 'img'] = fileName;
          } else {
            next.buttons[target.index][target.state === 'pressed' ? 'imgp' : 'img'] = fileName;
          }
        });
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const startAssignment = (target: number) => {
    if (!gamepadRef.current?.isConnected()) {
      window.alert(t('connectGamepadFirst'));
      return;
    }
    setAssigningTarget(target);
    axisHoldCounterRef.current = 0;
    axisHoldTargetRef.current = null;
  };

  const changeLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    localStorage.setItem('language', nextLanguage);
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <MantineProvider defaultColorScheme="auto">
      <aside id="sidebar">
        <div className="sidebar-header">
          <Title order={1}>{t('appTitle')}</Title>
          <p className="server-url">
            {t('obs')}: <span>{obsUrl}</span>
            <ActionIcon size="sm" variant="light" aria-label={t('copy')} onClick={() => navigator.clipboard.writeText(obsUrl)}>⧉</ActionIcon>
          </p>
        </div>

        <Paper className="panel" withBorder>
          <Stack gap="xs">
            <Title order={2}>{t('display')}</Title>
            <NativeSelect size="xs" label={t('language')} value={language} onChange={(event) => changeLanguage(event.target.value)} data={[{ value: 'ja', label: '日本語' }, { value: 'en', label: 'English' }]} />
            <label className="range-label">
              <span>{t('scale')} <b>{previewScale.toFixed(1)}</b></span>
              <input type="range" min="0.1" max="3" step="0.1" value={previewScale} onChange={(event) => setPreviewScale(parseFloat(event.target.value))} />
            </label>
            <label className="range-label">
              <span>{t('bgOpacity')} <b>{backgroundOpacity.toFixed(1)}</b></span>
              <input type="range" min="0" max="1" step="0.1" value={backgroundOpacity} onChange={(event) => setBackgroundOpacity(parseFloat(event.target.value))} />
            </label>
          </Stack>
        </Paper>

        <Paper className="panel" withBorder>
          <Stack gap="xs">
            <Title order={2}>{t('stick')}</Title>
            <Switch size="sm" label={t('showStick')} checked={layout.showstick} onChange={(event) => updateLayout((next) => { next.showstick = event.target.checked; })} />
            <div className="control row">
              <NumberInput size="xs" label="X" value={numericValue(layout.stick.x)} onChange={(value) => updateLayout((next) => { next.stick.x = String(value ?? ''); })} />
              <NumberInput size="xs" label="Y" value={numericValue(layout.stick.y)} onChange={(value) => updateLayout((next) => { next.stick.y = String(value ?? ''); })} />
            </div>
            <div className="control row">
              <NumberInput size="xs" label="W%" value={numericValue(layout.stick.w)} onChange={(value) => updateLayout((next) => { next.stick.w = String(value ?? ''); })} />
              <NumberInput size="xs" label="H%" value={numericValue(layout.stick.h)} onChange={(value) => updateLayout((next) => { next.stick.h = String(value ?? ''); })} />
            </div>
            <Switch
              size="sm"
              label={t('useCssStick')}
              checked={layout.stick.useCss ?? false}
              onChange={(event) => updateLayout((next) => { next.stick.useCss = event.target.checked; })}
            />
            {layout.stick.useCss && (
              <>
                <div className="control row">
                  <div>
                    <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>{t('stickPlateColor')}</label>
                    <input
                      type="color"
                      value={layout.stick.cssPlateColor || '#888888'}
                      onChange={(e) => updateLayout((next) => { next.stick.cssPlateColor = e.target.value; })}
                      style={{ width: '100%', height: '30px', cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>{t('stickKnobShaft')}</label>
                    <input
                      type="color"
                      value={layout.stick.cssColor || '#cccccc'}
                      onChange={(e) => updateLayout((next) => { next.stick.cssColor = e.target.value; })}
                      style={{ width: '100%', height: '30px', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </>
            )}
          </Stack>
        </Paper>

        <Paper className="panel" withBorder>
          <Stack gap="xs">
            <Title order={2}>{t('buttons')}</Title>
            <NumberInput size="xs" label={t('count')} min={0} max={48} value={layout.totalbuttonshow} onChange={(value) => updateLayout((next) => { next.totalbuttonshow = Math.max(0, Math.min(48, Number(value) || 0)); })} />
            <Switch size="sm" label={t('showBackground')} checked={layout.background.show} onChange={(event) => updateLayout((next) => { next.background.show = event.target.checked; })} />
            <Switch
              size="sm"
              label={t('useCssBg')}
              checked={layout.background.useCss ?? true}
              onChange={(event) => updateLayout((next) => { next.background.useCss = event.target.checked; })}
            />
            {layout.background.useCss ? (
              <>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>{t('bgColor')}</label>
                  <input
                    type="color"
                    value={layout.background.cssColor || '#0b0f14'}
                    onChange={(e) => updateLayout((next) => { next.background.cssColor = e.target.value; })}
                    style={{ width: '100%', height: '30px', cursor: 'pointer' }}
                  />
                </div>
                <NumberInput size="xs" label={t('borderRadius')} min={0} max={999} value={layout.background.cssBorderRadius ?? 0} onChange={(value) => updateLayout((next) => { next.background.cssBorderRadius = Number(value) || 0; })} />
              </>
            ) : (
              <Group gap="xs" align="end" wrap="nowrap">
                <TextInput size="xs" label={t('bgImage')} value={layout.background.image} onChange={(event) => updateLayout((next) => { next.background.image = event.target.value; })} placeholder="filename.png" className="grow" />
                <Button size="xs" variant="light" onClick={() => openImagePicker({ type: 'background' })}>{t('selectFile')}</Button>
              </Group>
            )}
            <NumberInput size="xs" label={t('bgScale')} min={0.1} max={5} step={0.1} value={numericValue(layout.background.scale || '1')} onChange={(value) => updateLayout((next) => { next.background.scale = String(value ?? ''); })} />
            <div className="control row obs-size-row">
              <label>{t('obsWidth')}</label><span className="readonly-value">{layout.background.w || '500'}</span>
              <label>{t('obsHeight')}</label><span className="readonly-value">{layout.background.h || '250'}</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadImage} hidden />
          </Stack>
        </Paper>

        <Paper className="panel" withBorder>
          <Stack gap="xs">
            <Title order={2}>{t('buttonImages')}</Title>
            <Switch
              size="sm"
              label={t('useCssButton')}
              checked={layout.defaultbuttons.useCss ?? false}
              onChange={(event) => updateLayout((next) => { next.defaultbuttons.useCss = event.target.checked; })}
            />
            {layout.defaultbuttons.useCss && (
              <div className="control row">
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>{t('colorNormal')}</label>
                  <input
                    type="color"
                    value={layout.defaultbuttons.cssColor || '#cccccc'}
                    onChange={(e) => updateLayout((next) => { next.defaultbuttons.cssColor = e.target.value; })}
                    style={{ width: '100%', height: '30px', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>{t('colorPressed')}</label>
                  <input
                    type="color"
                    value={layout.defaultbuttons.cssPressedColor || '#999999'}
                    onChange={(e) => updateLayout((next) => { next.defaultbuttons.cssPressedColor = e.target.value; })}
                    style={{ width: '100%', height: '30px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}
            {layout.defaultbuttons.useCss && (
              <div className="control row">
                <NumberInput
                  size="xs"
                  label="Transition (秒)"
                  min={0}
                  max={1}
                  step={0.01}
                  value={parseFloat(layout.defaultbuttons.cssTransition || '0.02')}
                  onChange={(value) => updateLayout((next) => { next.defaultbuttons.cssTransition = String(value ?? 0.02); })}
                />
                <NativeSelect
                  size="xs"
                  label="Easing"
                  value={layout.defaultbuttons.cssEasing || 'ease'}
                  onChange={(event) => updateLayout((next) => { next.defaultbuttons.cssEasing = event.target.value; })}
                  data={[
                    { value: 'ease', label: 'ease' },
                    { value: 'linear', label: 'linear' },
                    { value: 'ease-in', label: 'ease-in' },
                    { value: 'ease-out', label: 'ease-out' },
                    { value: 'ease-in-out', label: 'ease-in-out' }
                  ]}
                />
              </div>
            )}
            {!layout.defaultbuttons.useCss && (
              <>
                <Group gap="xs" align="end" wrap="nowrap">
                  <TextInput size="xs" label={t('defaultReleasedImage')} value={layout.defaultbuttons.img} onChange={(event) => updateLayout((next) => { next.defaultbuttons.img = event.target.value; })} placeholder="button-released.png" className="grow" />
                  <Button size="xs" variant="light" onClick={() => openImagePicker({ type: 'defaultButton', state: 'released' })}>{t('selectFile')}</Button>
                </Group>
                <Group gap="xs" align="end" wrap="nowrap">
                  <TextInput size="xs" label={t('defaultPressedImage')} value={layout.defaultbuttons.imgp} onChange={(event) => updateLayout((next) => { next.defaultbuttons.imgp = event.target.value; })} placeholder="button-pressed.png" className="grow" />
                  <Button size="xs" variant="light" onClick={() => openImagePicker({ type: 'defaultButton', state: 'pressed' })}>{t('selectFile')}</Button>
                </Group>
              </>
            )}
            <Text size="xs" fw={600}>{t('defaultButtonSize')}</Text>
            <div className="control row">
              <NumberInput size="xs" label="W" value={numericValue(layout.defaultbuttons.w)} onChange={(value) => updateLayout((next) => { next.defaultbuttons.w = String(value ?? ''); })} />
              <NumberInput size="xs" label="H" value={numericValue(layout.defaultbuttons.h)} onChange={(value) => updateLayout((next) => { next.defaultbuttons.h = String(value ?? ''); })} />
            </div>
            <div className="control row">
              <NumberInput size="xs" label="Pressed W" value={numericValue(layout.defaultbuttons.wp)} onChange={(value) => updateLayout((next) => { next.defaultbuttons.wp = String(value ?? ''); })} />
              <NumberInput size="xs" label="Pressed H" value={numericValue(layout.defaultbuttons.hp)} onChange={(value) => updateLayout((next) => { next.defaultbuttons.hp = String(value ?? ''); })} />
            </div>
            <NativeSelect
              size="xs"
              label={t('editButton')}
              value={selectedButtonIndex === null ? '' : String(selectedButtonIndex)}
              onChange={(event) => setSelectedButtonIndex(event.target.value === '' ? null : parseInt(event.target.value))}
              data={[
                { value: '', label: t('select') },
                ...Array.from({ length: Math.max(1, layout.totalbuttonshow) }, (_, index) => ({ value: String(index), label: `Button ${index + 1}` }))
              ]}
            />
            {selectedButtonIndex !== null && (
              <Group gap="xs">
                <Switch
                  size="sm"
                  label={t('useCssButton')}
                  checked={layout.buttons[selectedButtonIndex]?.useCss ?? layout.defaultbuttons.useCss ?? false}
                  onChange={(event) => updateLayout((next) => { next.buttons[selectedButtonIndex].useCss = event.target.checked; })}
                />
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  onClick={() => {
                    updateLayout((next) => {
                      next.buttons[selectedButtonIndex] = {
                        x: next.buttons[selectedButtonIndex].x,
                        y: next.buttons[selectedButtonIndex].y,
                        w: next.defaultbuttons.w,
                        h: next.defaultbuttons.h,
                        img: next.defaultbuttons.img,
                        xp: next.defaultbuttons.xp,
                        yp: next.defaultbuttons.yp,
                        wp: next.defaultbuttons.wp,
                        hp: next.defaultbuttons.hp,
                        imgp: next.defaultbuttons.imgp,
                        useCss: next.defaultbuttons.useCss,
                        cssColor: next.defaultbuttons.cssColor,
                        cssPressedColor: next.defaultbuttons.cssPressedColor,
                        cssTransition: next.defaultbuttons.cssTransition,
                        cssEasing: next.defaultbuttons.cssEasing
                      };
                    });
                  }}
                >
                  {t('resetToDefault')}
                </Button>
              </Group>
            )}
            {selectedButtonIndex !== null && (layout.buttons[selectedButtonIndex]?.useCss ?? layout.defaultbuttons.useCss ?? false) && (
              <div className="control row">
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>{t('colorNormal')}</label>
                  <input
                    type="color"
                    value={layout.buttons[selectedButtonIndex]?.cssColor === layout.defaultbuttons.cssColor ? '#cccccc' : (layout.buttons[selectedButtonIndex]?.cssColor ?? layout.defaultbuttons.cssColor ?? '#cccccc')}
                    onChange={(e) => updateLayout((next) => { next.buttons[selectedButtonIndex].cssColor = e.target.value; })}
                    style={{ width: '100%', height: '30px', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>{t('colorPressed')}</label>
                  <input
                    type="color"
                    value={layout.buttons[selectedButtonIndex]?.cssPressedColor === layout.defaultbuttons.cssPressedColor ? '#999999' : (layout.buttons[selectedButtonIndex]?.cssPressedColor ?? layout.defaultbuttons.cssPressedColor ?? '#999999')}
                    onChange={(e) => updateLayout((next) => { next.buttons[selectedButtonIndex].cssPressedColor = e.target.value; })}
                    style={{ width: '100%', height: '30px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}
            {selectedButtonIndex !== null && (layout.buttons[selectedButtonIndex]?.useCss ?? layout.defaultbuttons.useCss ?? false) && (
              <div className="control row">
                <NumberInput
                  size="xs"
                  label="Transition (秒)"
                  min={0}
                  max={1}
                  step={0.01}
                  value={layout.buttons[selectedButtonIndex]?.cssTransition === layout.defaultbuttons.cssTransition ? '' : parseFloat(layout.buttons[selectedButtonIndex]?.cssTransition ?? layout.defaultbuttons.cssTransition ?? '0.02')}
                  onChange={(value) => updateLayout((next) => { next.buttons[selectedButtonIndex].cssTransition = String(value ?? 0.02); })}
                  placeholder={layout.defaultbuttons.cssTransition || '0.02'}
                />
                <NativeSelect
                  size="xs"
                  label="Easing"
                  value={layout.buttons[selectedButtonIndex]?.cssEasing === layout.defaultbuttons.cssEasing ? '' : (layout.buttons[selectedButtonIndex]?.cssEasing ?? layout.defaultbuttons.cssEasing ?? 'ease')}
                  onChange={(event) => updateLayout((next) => { next.buttons[selectedButtonIndex].cssEasing = event.target.value; })}
                  data={[
                    { value: '', label: '標準準拠' },
                    { value: 'ease', label: 'ease' },
                    { value: 'linear', label: 'linear' },
                    { value: 'ease-in', label: 'ease-in' },
                    { value: 'ease-out', label: 'ease-out' },
                    { value: 'ease-in-out', label: 'ease-in-out' }
                  ]}
                />
              </div>
            )}
            {selectedButtonIndex !== null && !(layout.buttons[selectedButtonIndex]?.useCss ?? layout.defaultbuttons.useCss ?? false) && (
              <>
                <Group gap="xs" align="end" wrap="nowrap">
                  <TextInput
                    size="xs"
                    label={t('releasedImage')}
                    value={layout.buttons[selectedButtonIndex]?.img === layout.defaultbuttons.img ? '' : (layout.buttons[selectedButtonIndex]?.img || '')}
                    onChange={(event) => updateLayout((next) => { next.buttons[selectedButtonIndex].img = event.target.value; })}
                    placeholder={layout.defaultbuttons.img || 'button-released.png'}
                    className="grow"
                  />
                  <Button size="xs" variant="light" onClick={() => openImagePicker({ type: 'button', index: selectedButtonIndex, state: 'released' })}>{t('selectFile')}</Button>
                </Group>
                <Group gap="xs" align="end" wrap="nowrap">
                  <TextInput
                    size="xs"
                    label={t('pressedImage')}
                    value={layout.buttons[selectedButtonIndex]?.imgp === layout.defaultbuttons.imgp ? '' : (layout.buttons[selectedButtonIndex]?.imgp || '')}
                    onChange={(event) => updateLayout((next) => { next.buttons[selectedButtonIndex].imgp = event.target.value; })}
                    placeholder={layout.defaultbuttons.imgp || 'button-pressed.png'}
                    className="grow"
                  />
                  <Button size="xs" variant="light" onClick={() => openImagePicker({ type: 'button', index: selectedButtonIndex, state: 'pressed' })}>{t('selectFile')}</Button>
                </Group>
                <Text size="xs" fw={600}>{t('releasedSize')}</Text>
                <div className="control row">
                  <NumberInput size="xs" label="W" value={layout.buttons[selectedButtonIndex]?.w === layout.defaultbuttons.w ? '' : numericValue(layout.buttons[selectedButtonIndex]?.w || '')} onChange={(value) => updateLayout((next) => { next.buttons[selectedButtonIndex].w = String(value ?? ''); })} placeholder={layout.defaultbuttons.w || '60'} />
                  <NumberInput size="xs" label="H" value={layout.buttons[selectedButtonIndex]?.h === layout.defaultbuttons.h ? '' : numericValue(layout.buttons[selectedButtonIndex]?.h || '')} onChange={(value) => updateLayout((next) => { next.buttons[selectedButtonIndex].h = String(value ?? ''); })} placeholder={layout.defaultbuttons.h || '60'} />
                </div>
                <Text size="xs" fw={600}>{t('pressedSize')}</Text>
                <div className="control row">
                  <NumberInput size="xs" label="W" value={layout.buttons[selectedButtonIndex]?.wp === layout.defaultbuttons.wp ? '' : numericValue(layout.buttons[selectedButtonIndex]?.wp || '')} onChange={(value) => updateLayout((next) => { next.buttons[selectedButtonIndex].wp = String(value ?? ''); })} placeholder={layout.defaultbuttons.wp || '60'} />
                  <NumberInput size="xs" label="H" value={layout.buttons[selectedButtonIndex]?.hp === layout.defaultbuttons.hp ? '' : numericValue(layout.buttons[selectedButtonIndex]?.hp || '')} onChange={(value) => updateLayout((next) => { next.buttons[selectedButtonIndex].hp = String(value ?? ''); })} placeholder={layout.defaultbuttons.hp || '60'} />
                </div>
              </>
            )}
            <Text size="xs" c="dimmed">{t('useDefaultWhenBlank')}</Text>
          </Stack>
        </Paper>

        <Paper className="panel" withBorder>
          <Stack gap="xs">
            <Title order={2}>{t('layout')}</Title>
            <Group gap="xs" align="end" wrap="nowrap">
              <NativeSelect size="xs" value={selectedLayout} onChange={(event) => setSelectedLayout(event.target.value)} data={layoutNames.map((name) => ({ value: name, label: name }))} className="grow" />
              <Button size="xs" variant="light" onClick={loadLayout}>{t('load')}</Button>
            </Group>
            <Group gap="xs" align="end" wrap="nowrap">
              <TextInput size="xs" value={layoutName} onChange={(event) => setLayoutName(event.target.value)} placeholder="name" className="grow" />
              <Button size="xs" onClick={saveLayout}>{t('save')}</Button>
            </Group>
            <Button size="xs" fullWidth onClick={setDefaultLayout}>{t('setDefault')}</Button>
          </Stack>
        </Paper>

        <Paper className="panel" withBorder>
          <Title order={2}>{t('gamepad')}</Title>
          <Text size="xs" className={connected ? 'status-connected' : 'status-disconnected'}>
            {connected ? t('connected', { name: gamepadName }) : t('notConnected')}
          </Text>
        </Paper>

        <Paper className="panel" withBorder>
          <Title order={2}>{t('buttonMapping')}</Title>
          <Text size="xs" c="dimmed">{t('clickPreviewToAssign')}</Text>
          {assigningTarget !== null && (
            <div className="mapping-status">
              <p>{t('assigning')}: <span>{assignmentName}</span></p>
              <Text size="xs" c="dimmed">{t('pressButtonOrHoldAxis')}</Text>
              <Button size="xs" variant="light" onClick={() => setAssigningTarget(null)}>{t('cancel')}</Button>
            </div>
          )}
        </Paper>
      </aside>

      <main id="preview">
        <div id="preview-container" style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
          <GamepadView
            layout={layout}
            stickClass={snapshot.stickClass}
            pressedButtons={snapshot.pressedButtons}
            connected={connected}
            backgroundOpacity={backgroundOpacity}
            editorMode
            selectedButtonIndex={selectedButtonIndex}
            onBackgroundSizeChange={updateBackgroundSize}
            onButtonClick={(index) => startAssignment(index)}
            onStickClick={(index) => startAssignment(1000 + index)}
            onButtonPositionChange={handleButtonPositionChange}
            onStickPositionChange={handleStickPositionChange}
          />
        </div>
      </main>
    </MantineProvider>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<EditorApp />);
}
