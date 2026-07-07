import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, STICK_NAMES } from '../types';

export interface GamepadViewProps {
  layout: Layout;
  stickClass: string;
  pressedButtons: boolean[];
  connected: boolean;
  backgroundOpacity?: number;
  editorMode?: boolean;
  selectedButtonIndex?: number | null;
  onBackgroundSizeChange?: (width: number, height: number) => void;
  onButtonClick?: (index: number) => void;
  onStickClick?: (index: number) => void;
  onButtonPositionChange?: (index: number, x: number, y: number) => void;
  onStickPositionChange?: (x: number, y: number) => void;
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

export function GamepadView(props: GamepadViewProps): React.ReactElement {
  const { t } = useTranslation();
  const {
    layout,
    stickClass,
    pressedButtons,
    connected,
    backgroundOpacity = 1,
    editorMode = false,
    selectedButtonIndex,
    onBackgroundSizeChange,
    onButtonClick,
    onStickClick,
    onButtonPositionChange,
    onStickPositionChange
  } = props;
  const backgroundSize = useBackgroundSize(layout, onBackgroundSizeChange);
  const defaultButton = layout.defaultbuttons;
  const stickScaleX = layout.stick.w ? parseFloat(layout.stick.w) / 100 : 1;
  const stickScaleY = layout.stick.h ? parseFloat(layout.stick.h) / 100 : 1;

  const stickCss = layout.stick.useCss ?? false;

  const [dragState, setDragState] = useState<{
    type: 'button' | 'stick';
    index: number;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'button' | 'stick', index: number, initialX: number, initialY: number) => {
    if (!editorMode) return;
    e.stopPropagation();
    setDragState({
      type,
      index,
      startX: e.clientX,
      startY: e.clientY,
      initialX,
      initialY
    });
  }, [editorMode]);

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      const newX = Math.round(dragState.initialX + deltaX);
      const newY = Math.round(dragState.initialY + deltaY);

      if (dragState.type === 'button') {
        onButtonPositionChange?.(dragState.index, newX, newY);
      } else if (dragState.type === 'stick') {
        onStickPositionChange?.(newX, newY);
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, onButtonPositionChange, onStickPositionChange]);

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
            className={`stick-area ${stickCss ? 'stick-css' : ''}`}
            style={{
              left: layout.stick.x ? `${layout.stick.x}px` : undefined,
              top: layout.stick.y ? `${layout.stick.y}px` : undefined,
              transform: `translate(-50%,-50%) scale(${stickScaleX},${stickScaleY})`,
              display: layout.showstick ? undefined : 'none',
              cursor: editorMode ? 'move' : undefined,
              ...(stickCss ? {
                '--stick-color': layout.stick.cssColor ?? '#cccccc',
                '--stick-plate-color': layout.stick.cssPlateColor ?? '#888888',
                '--stick-transition': `${layout.stick.cssTransition ?? '0.02'}s`,
                '--stick-easing': layout.stick.cssEasing ?? 'ease'
              } as React.CSSProperties : {})
            }}
            onMouseDown={editorMode ? (e) => handleMouseDown(e, 'stick', 0, parseFloat(layout.stick.x) || 110, parseFloat(layout.stick.y) || 125) : undefined}
          >
            {stickCss && (() => {
              const dir = stickClass.startsWith('stick ') ? stickClass.slice(6) : '';
              return <div id="stick-shaft" className={`stick-shaft${dir ? ' ' + dir : ''}`} />;
            })()}
            <div id="stick" className={stickCss ? `${stickClass} stick-css` : stickClass} />
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
              const releasedImage = button.img === defaultButton.img ? '' : button.img;
              const pressedImage = button.imgp === defaultButton.imgp ? '' : button.imgp;
              const releasedWidth = button.w === defaultButton.w ? '' : button.w;
              const releasedHeight = button.h === defaultButton.h ? '' : button.h;
              const pressedWidth = button.wp === defaultButton.wp ? '' : button.wp;
              const pressedHeight = button.hp === defaultButton.hp ? '' : button.hp;
              
              const useCss = button.useCss ?? defaultButton.useCss ?? false;
              const useImage = pressed ? pressedImage : releasedImage;
              const cssColor = button.cssColor ?? defaultButton.cssColor ?? '#cccccc';
              const cssPressedColor = button.cssPressedColor ?? defaultButton.cssPressedColor ?? '#999999';
              const cssTransition = button.cssTransition ?? defaultButton.cssTransition ?? '0.02';
              const cssEasing = button.cssEasing ?? defaultButton.cssEasing ?? 'ease';
              const style: React.CSSProperties = {
                left: `${button.x || defaultButton.x || 0}px`,
                top: `${button.y || defaultButton.y || 0}px`,
                width: `${pressed ? (pressedWidth || defaultButton.wp || defaultButton.w || '60') : (releasedWidth || defaultButton.w || '60')}px`,
                height: `${pressed ? (pressedHeight || defaultButton.hp || defaultButton.h || '60') : (releasedHeight || defaultButton.h || '60')}px`,
                cursor: editorMode ? 'move' : undefined,
                '--button-color': pressed ? cssPressedColor : cssColor,
                '--button-shadow-color': pressed ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)',
                '--button-transition': `${cssTransition}s`,
                '--button-easing': cssEasing
              } as React.CSSProperties;

              if (!useCss && useImage) {
                style.backgroundImage = `url("${assetUrl(layout, useImage)}")`;
              }

              if (pressed) {
                if (button.xp || defaultButton.xp) style.left = `${button.xp || defaultButton.xp}px`;
                if (button.yp || defaultButton.yp) style.top = `${button.yp || defaultButton.yp}px`;
              }

              const className = `gamepad-button button${index} ${pressed ? 'button-pressed' : 'button-released'} ${useCss ? 'button-css' : ''} ${editorMode && selectedButtonIndex !== null && selectedButtonIndex !== undefined && selectedButtonIndex === index ? 'button-selected' : ''}`;

              return (
                <div
                  id={`button${index}`}
                  className={className}
                  key={index}
                  onClick={editorMode ? () => onButtonClick?.(index) : undefined}
                  onMouseDown={editorMode ? (e) => handleMouseDown(e, 'button', index, parseFloat(button.x || defaultButton.x || '0'), parseFloat(button.y || defaultButton.y || '0')) : undefined}
                  style={style}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
