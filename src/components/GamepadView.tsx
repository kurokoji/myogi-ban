import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, STICK_NAMES } from '../types';

export interface GamepadViewProps {
  layout: Layout;
  stickClass: string;
  pressedButtons: boolean[];
  connected: boolean;
  inputHistory: number[][];
  backgroundOpacity?: number;
  editorMode?: boolean;
  onBackgroundSizeChange?: (width: number, height: number) => void;
  onButtonClick?: (index: number) => void;
  onStickClick?: (index: number) => void;
}

function assetUrl(layout: Layout, fileName: string): string {
  return `layout/${layout.name}/${fileName}`;
}

function getImageStyle(layout: Layout, fileName: string): React.CSSProperties {
  return fileName ? { backgroundImage: `url("${assetUrl(layout, fileName)}")` } : {};
}

function useBackgroundSize(layout: Layout, onChange?: (width: number, height: number) => void): { width: number; height: number } {
  const [naturalSize, setNaturalSize] = useState<{ key: string; width: number; height: number } | null>(null);
  const imageUrl = layout.background.image ? assetUrl(layout, layout.background.image) : '';

  useEffect(() => {
    if (!imageUrl) {
      setNaturalSize(null);
      return;
    }
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) {
        setNaturalSize({ key: imageUrl, width: image.naturalWidth, height: image.naturalHeight });
      }
    };
    image.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const size = useMemo(() => {
    const naturalWidth = naturalSize?.key === imageUrl ? naturalSize.width : undefined;
    const naturalHeight = naturalSize?.key === imageUrl ? naturalSize.height : undefined;
    const legacyWidth = layout.background.w ? parseFloat(layout.background.w) : 500;
    const legacyHeight = layout.background.h ? parseFloat(layout.background.h) : 250;
    const explicitScale = layout.background.scale !== undefined && layout.background.scale !== '';
    const scale = explicitScale
      ? Math.max(0.1, parseFloat(layout.background.scale) || 1)
      : naturalWidth && layout.background.w
        ? Math.max(0.1, parseFloat(layout.background.w) / naturalWidth)
        : naturalHeight && layout.background.h
          ? Math.max(0.1, parseFloat(layout.background.h) / naturalHeight)
          : 1;

    return {
      width: Math.round((naturalWidth || legacyWidth) * scale),
      height: Math.round((naturalHeight || legacyHeight) * scale)
    };
  }, [imageUrl, layout.background.h, layout.background.scale, layout.background.w, naturalSize]);

  useEffect(() => {
    onChange?.(size.width, size.height);
  }, [onChange, size.height, size.width]);

  return size;
}

function InputHistory({ layout, history }: { layout: Layout; history: number[][] }): React.ReactElement {
  const classes = ['inputlist'];
  if (!layout.inputhistorymode.toggle) classes.push('hide');
  if (layout.inputhistorymode.direction === 1) classes.push('horizontal');
  if (layout.inputhistorymode.direction === 2) classes.push('horizontal', 'up');

  return (
    <div id="inputlist" className={classes.join(' ')}>
      {history.map((inputs, index) => (
        <div className={`inputlistchild${layout.inputhistorymode.game === 'combination' ? ' combination' : ''}`} key={`${index}-${inputs.join('-')}`}>
          <div className="inputlistchildalign">
            {inputs.map((input, inputIndex) => {
              const isArrow = input >= 1000 && input < 2000;
              const displayInput = input < 999 ? input + 1 : input;
              return (
                <div
                  className={`inputlistelement inputlistelement${displayInput}${isArrow ? ' inputarrow' : ''}`}
                  key={`${input}-${inputIndex}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GamepadView(props: GamepadViewProps): React.ReactElement {
  const { t } = useTranslation();
  const {
    layout,
    stickClass,
    pressedButtons,
    connected,
    inputHistory,
    backgroundOpacity = 1,
    editorMode = false,
    onBackgroundSizeChange,
    onButtonClick,
    onStickClick
  } = props;
  const backgroundSize = useBackgroundSize(layout, onBackgroundSizeChange);
  const defaultButton = layout.defaultbuttons;
  const stickScaleX = layout.stick.w ? parseFloat(layout.stick.w) / 100 : 1;
  const stickScaleY = layout.stick.h ? parseFloat(layout.stick.h) / 100 : 1;

  return (
    <>
      <div id="gamepad0" className="gamepad-background">
        <div
          id="gamepad-background-image"
          className={`gamepad-disconnected${connected ? ' gamepad-connected' : ''}`}
          style={{ width: backgroundSize.width, height: backgroundSize.height }}
        >
          <div className="disconnected-text">{t('pressAnyButton')}</div>
        </div>
        <div id="gamepad-area" className="gamepad-area" style={{ width: backgroundSize.width, height: backgroundSize.height }}>
          <div
            id="gamepad-area-background"
            className="gamepad-area-background"
            style={{
              ...getImageStyle(layout, layout.background.image),
              width: backgroundSize.width,
              height: backgroundSize.height,
              opacity: backgroundOpacity,
              visibility: layout.background.show === false ? 'hidden' : 'visible'
            }}
          />
          <div
            id="stick-area"
            className="stick-area"
            style={{
              left: layout.stick.x ? `${layout.stick.x}px` : undefined,
              top: layout.stick.y ? `${layout.stick.y}px` : undefined,
              transform: `translate(-50%,-50%) scale(${stickScaleX},${stickScaleY})`,
              display: layout.showstick ? undefined : 'none'
            }}
          >
            <div id="stick" className={stickClass} />
            {STICK_NAMES.map((name, index) => (
              <div
                id={name}
                className={`stick-block ${name}`}
                key={name}
                onClick={editorMode ? () => onStickClick?.(index) : undefined}
              />
            ))}
          </div>
          <div id="button-area" className="button-area">
            {Array.from({ length: layout.totalbuttonshow }, (_, index) => {
              const button = layout.buttons[index] || defaultButton;
              const pressed = pressedButtons[index] || false;
              const releasedImage = button.img || defaultButton.img;
              const pressedImage = button.imgp || defaultButton.imgp;
              const releasedWidth = button.w || defaultButton.w || '60';
              const releasedHeight = button.h || defaultButton.h || '60';
              const pressedWidth = button.wp || defaultButton.wp || releasedWidth;
              const pressedHeight = button.hp || defaultButton.hp || releasedHeight;
              const style: React.CSSProperties = {
                left: `${button.x || defaultButton.x || 0}px`,
                top: `${button.y || defaultButton.y || 0}px`,
                width: `${pressed ? pressedWidth : releasedWidth}px`,
                height: `${pressed ? pressedHeight : releasedHeight}px`,
                ...getImageStyle(layout, pressed ? pressedImage : releasedImage)
              };
              if (pressed) {
                if (button.xp || defaultButton.xp) style.left = `${button.xp || defaultButton.xp}px`;
                if (button.yp || defaultButton.yp) style.top = `${button.yp || defaultButton.yp}px`;
              }
              return (
                <div
                  id={`button${index}`}
                  className={`gamepad-button button${index} ${pressed ? 'button-pressed' : 'button-released'}`}
                  key={index}
                  onClick={editorMode ? () => onButtonClick?.(index) : undefined}
                  style={style}
                />
              );
            })}
          </div>
        </div>
      </div>
      <InputHistory layout={layout} history={inputHistory} />
    </>
  );
}
