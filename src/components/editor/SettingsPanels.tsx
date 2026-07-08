import { ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';
import {
  Button,
  Group,
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
import { AssigningTarget, EditorLayoutUpdater, ImageUploadTarget, createEmptyButtonLayout, numericValue } from '../../editor-helpers';
import { Layout, LayoutEntry } from '../../types';

interface DisplaySettingsPanelProps {
  language: string;
  previewScale: number;
  backgroundOpacity: number;
  onLanguageChange: (language: string) => void;
  onPreviewScaleChange: (scale: number) => void;
  onBackgroundOpacityChange: (opacity: number) => void;
}

export function DisplaySettingsPanel(props: DisplaySettingsPanelProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Paper className="panel" withBorder>
      <Stack gap="xs">
        <Title order={2}>{t('display')}</Title>
        <NativeSelect size="xs" label={t('language')} value={props.language} onChange={(event) => props.onLanguageChange(event.target.value)} data={[{ value: 'ja', label: '日本語' }, { value: 'en', label: 'English' }]} />
        <label className="range-label">
          <span>{t('scale')} <b>{props.previewScale.toFixed(1)}</b></span>
          <input type="range" min="0.1" max="3" step="0.1" value={props.previewScale} onChange={(event) => props.onPreviewScaleChange(parseFloat(event.target.value))} />
        </label>
        <label className="range-label">
          <span>{t('bgOpacity')} <b>{props.backgroundOpacity.toFixed(1)}</b></span>
          <input type="range" min="0" max="1" step="0.1" value={props.backgroundOpacity} onChange={(event) => props.onBackgroundOpacityChange(parseFloat(event.target.value))} />
        </label>
      </Stack>
    </Paper>
  );
}

interface StickSettingsPanelProps {
  layout: Layout;
  updateLayout: EditorLayoutUpdater;
}

export function StickSettingsPanel({ layout, updateLayout }: StickSettingsPanelProps): React.ReactElement {
  const { t } = useTranslation();

  return (
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
        )}
      </Stack>
    </Paper>
  );
}

interface BackgroundSettingsPanelProps {
  layout: Layout;
  fileInputRef: RefObject<HTMLInputElement | null>;
  updateLayout: EditorLayoutUpdater;
  uploadImage: (event: ChangeEvent<HTMLInputElement>) => void;
  openImagePicker: (target: ImageUploadTarget) => void;
}

export function BackgroundSettingsPanel(props: BackgroundSettingsPanelProps): React.ReactElement {
  const { t } = useTranslation();
  const { layout, updateLayout } = props;

  return (
    <Paper className="panel" withBorder>
      <Stack gap="xs">
        <Title order={2}>{t('background')}</Title>
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
            <div className="control row">
              <NumberInput size="xs" label={t('obsWidth')} min={1} value={numericValue(layout.background.w)} onChange={(value) => updateLayout((next) => { next.background.w = String(value ?? ''); })} />
              <NumberInput size="xs" label={t('obsHeight')} min={1} value={numericValue(layout.background.h)} onChange={(value) => updateLayout((next) => { next.background.h = String(value ?? ''); })} />
            </div>
          </>
        ) : (
          <>
            <Group gap="xs" align="end" wrap="nowrap">
              <TextInput size="xs" label={t('bgImage')} value={layout.background.image} onChange={(event) => updateLayout((next) => { next.background.image = event.target.value; })} placeholder="filename.png" className="grow" />
              <Button size="xs" variant="light" onClick={() => props.openImagePicker({ type: 'background' })}>{t('selectFile')}</Button>
            </Group>
            <NumberInput size="xs" label={t('bgScale')} min={0.1} max={5} step={0.1} value={numericValue(layout.background.scale || '1')} onChange={(value) => updateLayout((next) => { next.background.scale = String(value ?? ''); })} />
            {layout.background.image && (
              <div className="control row obs-size-row">
                <label>{t('obsWidth')}</label><span className="readonly-value">{layout.background.w || '500'}</span>
                <label>{t('obsHeight')}</label><span className="readonly-value">{layout.background.h || '250'}</span>
              </div>
            )}
          </>
        )}
        <input ref={props.fileInputRef} type="file" accept="image/*" onChange={props.uploadImage} hidden />
      </Stack>
    </Paper>
  );
}

interface ButtonSettingsPanelProps {
  layout: Layout;
  assigningTarget: AssigningTarget;
  assignmentName: string;
  selectedButtonIndex: number | null;
  updateLayout: EditorLayoutUpdater;
  setSelectedButtonIndex: Dispatch<SetStateAction<number | null>>;
  openImagePicker: (target: ImageUploadTarget) => void;
  cancelAssignment: () => void;
}

export function ButtonSettingsPanel(props: ButtonSettingsPanelProps): React.ReactElement {
  const { t } = useTranslation();
  const { layout, selectedButtonIndex, updateLayout } = props;

  return (
    <Paper className="panel" withBorder>
      <Stack gap="xs">
        <Title order={2}>{t('buttons')}</Title>
        <NumberInput size="xs" label={t('count')} min={0} max={48} value={layout.totalbuttonshow} onChange={(value) => updateLayout((next) => { next.totalbuttonshow = Math.max(0, Math.min(48, Number(value) || 0)); while (next.buttons.length < next.totalbuttonshow) next.buttons.push(createEmptyButtonLayout()); })} />
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
              label={t('transition')}
              min={0}
              max={1}
              step={0.01}
              value={parseFloat(layout.defaultbuttons.cssTransition || '0.02')}
              onChange={(value) => updateLayout((next) => { next.defaultbuttons.cssTransition = String(value ?? 0.02); })}
            />
            <NativeSelect
              size="xs"
              label={t('easing')}
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
              <Button size="xs" variant="light" onClick={() => props.openImagePicker({ type: 'defaultButton', state: 'released' })}>{t('selectFile')}</Button>
            </Group>
            <Group gap="xs" align="end" wrap="nowrap">
              <TextInput size="xs" label={t('defaultPressedImage')} value={layout.defaultbuttons.imgp} onChange={(event) => updateLayout((next) => { next.defaultbuttons.imgp = event.target.value; })} placeholder="button-pressed.png" className="grow" />
              <Button size="xs" variant="light" onClick={() => props.openImagePicker({ type: 'defaultButton', state: 'pressed' })}>{t('selectFile')}</Button>
            </Group>
          </>
        )}
        <Text size="xs" fw={600}>{t('defaultButtonSize')}</Text>
        <div className="control row">
          <NumberInput size="xs" label={t('width')} value={numericValue(layout.defaultbuttons.w)} onChange={(value) => updateLayout((next) => { next.defaultbuttons.w = String(value ?? ''); })} />
          <NumberInput size="xs" label={t('height')} value={numericValue(layout.defaultbuttons.h)} onChange={(value) => updateLayout((next) => { next.defaultbuttons.h = String(value ?? ''); })} />
        </div>
        <div className="control row">
          <NumberInput size="xs" label={t('pressedWidth')} value={numericValue(layout.defaultbuttons.wp)} onChange={(value) => updateLayout((next) => { next.defaultbuttons.wp = String(value ?? ''); })} />
          <NumberInput size="xs" label={t('pressedHeight')} value={numericValue(layout.defaultbuttons.hp)} onChange={(value) => updateLayout((next) => { next.defaultbuttons.hp = String(value ?? ''); })} />
        </div>
        <NativeSelect
          size="xs"
          label={t('editButton')}
          value={selectedButtonIndex === null ? '' : String(selectedButtonIndex)}
          onChange={(event) => props.setSelectedButtonIndex(event.target.value === '' ? null : parseInt(event.target.value))}
          data={[
            { value: '', label: t('select') },
            ...Array.from({ length: Math.max(1, layout.totalbuttonshow) }, (_, index) => ({ value: String(index), label: `${t('buttonLabel')} ${index + 1}` }))
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
        <Button
          size="xs"
          variant="light"
          color="gray"
          onClick={() => updateLayout((next) => { next.buttons = next.buttons.map((b) => ({ x: b.x, y: b.y, w: next.defaultbuttons.w, h: next.defaultbuttons.h, img: next.defaultbuttons.img, xp: next.defaultbuttons.xp, yp: next.defaultbuttons.yp, wp: next.defaultbuttons.wp, hp: next.defaultbuttons.hp, imgp: next.defaultbuttons.imgp, useCss: next.defaultbuttons.useCss, cssColor: next.defaultbuttons.cssColor, cssPressedColor: next.defaultbuttons.cssPressedColor, cssTransition: next.defaultbuttons.cssTransition, cssEasing: next.defaultbuttons.cssEasing })); })}
        >
          {t('resetAllToDefault')}
        </Button>
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
              label={t('transition')}
              min={0}
              max={1}
              step={0.01}
              value={layout.buttons[selectedButtonIndex]?.cssTransition === layout.defaultbuttons.cssTransition ? '' : parseFloat(layout.buttons[selectedButtonIndex]?.cssTransition ?? layout.defaultbuttons.cssTransition ?? '0.02')}
              onChange={(value) => updateLayout((next) => { next.buttons[selectedButtonIndex].cssTransition = String(value ?? 0.02); })}
              placeholder={layout.defaultbuttons.cssTransition || '0.02'}
            />
            <NativeSelect
              size="xs"
              label={t('easing')}
              value={layout.buttons[selectedButtonIndex]?.cssEasing === layout.defaultbuttons.cssEasing ? '' : (layout.buttons[selectedButtonIndex]?.cssEasing ?? layout.defaultbuttons.cssEasing ?? 'ease')}
              onChange={(event) => updateLayout((next) => { next.buttons[selectedButtonIndex].cssEasing = event.target.value; })}
              data={[
                { value: '', label: t('inheritDefault') },
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
              <Button size="xs" variant="light" onClick={() => props.openImagePicker({ type: 'button', index: selectedButtonIndex, state: 'released' })}>{t('selectFile')}</Button>
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
              <Button size="xs" variant="light" onClick={() => props.openImagePicker({ type: 'button', index: selectedButtonIndex, state: 'pressed' })}>{t('selectFile')}</Button>
            </Group>
            <Text size="xs" fw={600}>{t('releasedSize')}</Text>
            <div className="control row">
              <NumberInput size="xs" label={t('width')} value={layout.buttons[selectedButtonIndex]?.w === layout.defaultbuttons.w ? '' : numericValue(layout.buttons[selectedButtonIndex]?.w || '')} onChange={(value) => updateLayout((next) => { next.buttons[selectedButtonIndex].w = String(value ?? ''); })} placeholder={layout.defaultbuttons.w || '60'} />
              <NumberInput size="xs" label={t('height')} value={layout.buttons[selectedButtonIndex]?.h === layout.defaultbuttons.h ? '' : numericValue(layout.buttons[selectedButtonIndex]?.h || '')} onChange={(value) => updateLayout((next) => { next.buttons[selectedButtonIndex].h = String(value ?? ''); })} placeholder={layout.defaultbuttons.h || '60'} />
            </div>
            <Text size="xs" fw={600}>{t('pressedSize')}</Text>
            <div className="control row">
              <NumberInput size="xs" label={t('pressedWidth')} value={layout.buttons[selectedButtonIndex]?.wp === layout.defaultbuttons.wp ? '' : numericValue(layout.buttons[selectedButtonIndex]?.wp || '')} onChange={(value) => updateLayout((next) => { next.buttons[selectedButtonIndex].wp = String(value ?? ''); })} placeholder={layout.defaultbuttons.wp || '60'} />
              <NumberInput size="xs" label={t('pressedHeight')} value={layout.buttons[selectedButtonIndex]?.hp === layout.defaultbuttons.hp ? '' : numericValue(layout.buttons[selectedButtonIndex]?.hp || '')} onChange={(value) => updateLayout((next) => { next.buttons[selectedButtonIndex].hp = String(value ?? ''); })} placeholder={layout.defaultbuttons.hp || '60'} />
            </div>
          </>
        )}
        <Text size="xs" c="dimmed">{t('useDefaultWhenBlank')}</Text>
        <Title order={2}>{t('buttonMapping')}</Title>
        <Text size="xs" c="dimmed">{t('clickPreviewToAssign')}</Text>
        {props.assigningTarget !== null && (
          <div className="mapping-status">
            <p>{t('assigning')}: <span>{props.assignmentName}</span></p>
            <Text size="xs" c="dimmed">{t('pressButtonOrHoldAxis')}</Text>
            <Button size="xs" variant="light" onClick={props.cancelAssignment}>{t('cancel')}</Button>
          </div>
        )}
      </Stack>
    </Paper>
  );
}

interface LayoutSettingsPanelProps {
  layoutNames: LayoutEntry[];
  selectedLayout: string;
  layoutName: string;
  setSelectedLayout: (value: string) => void;
  setLayoutName: (value: string) => void;
  loadLayout: () => void;
  saveLayout: () => void;
  setDefaultLayout: () => void;
  exportLayout: () => void;
  importLayout: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function LayoutSettingsPanel(props: LayoutSettingsPanelProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Paper className="panel" withBorder>
      <Stack gap="xs">
        <Title order={2}>{t('layout')}</Title>
        <Group gap="xs" align="end" wrap="nowrap">
          <NativeSelect size="xs" value={props.selectedLayout} onChange={(event) => props.setSelectedLayout(event.target.value)} data={props.layoutNames.map((entry) => ({ value: `${entry.name}:${entry.builtin ? 'builtin' : 'user'}`, label: entry.builtin ? `${entry.name} (${t('builtIn')})` : entry.name }))} className="grow" />
          <Button size="xs" variant="light" onClick={props.loadLayout}>{t('load')}</Button>
        </Group>
        <Group gap="xs" align="end" wrap="nowrap">
          <TextInput size="xs" value={props.layoutName} onChange={(event) => props.setLayoutName(event.target.value)} placeholder={t('layoutNamePlaceholder')} className="grow" />
          <Button size="xs" onClick={props.saveLayout}>{t('save')}</Button>
        </Group>
        <Button size="xs" fullWidth onClick={props.setDefaultLayout}>{t('setDefault')}</Button>
        <Group gap="xs" align="end" wrap="nowrap">
          <Button size="xs" variant="light" fullWidth onClick={props.exportLayout}>{t('export')}</Button>
          <Button size="xs" variant="light" fullWidth onClick={() => document.getElementById('import-layout-input')?.click()}>{t('import')}</Button>
        </Group>
        <input id="import-layout-input" type="file" accept=".json" hidden onChange={props.importLayout} />
      </Stack>
    </Paper>
  );
}

interface GamepadStatusPanelProps {
  connected: boolean;
  gamepadName: string;
}

export function GamepadStatusPanel({ connected, gamepadName }: GamepadStatusPanelProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Paper className="panel" withBorder>
      <Title order={2}>{t('gamepad')}</Title>
      <Text size="xs" className={connected ? 'status-connected' : 'status-disconnected'}>
        {connected ? t('connected', { name: gamepadName }) : t('notConnected')}
      </Text>
    </Paper>
  );
}
