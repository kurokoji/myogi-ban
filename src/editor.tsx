import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ActionIcon,
  MantineProvider,
  Text,
  Title
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import './i18n';
import i18n from './i18n';
import { ApiClient } from './api';
import { GamepadManager, ButtonMapping, StickMapping } from './gamepad';
import { createDefaultLayout, ensureLayoutDefaults } from './layout';
import { Layout, LayoutEntry, SERVER_URL } from './types';
import { GamepadView } from './components/GamepadView';
import {
  ImageUploadTarget,
  cloneLayout,
  createEmptyButtonLayout,
  layoutNameFromSelection,
  layoutSelectionValue,
  readFileAsDataUrl
} from './editor-helpers';
import { useEditorGamepad } from './hooks/useEditorGamepad';
import {
  BackgroundSettingsPanel,
  ButtonSettingsPanel,
  DisplaySettingsPanel,
  GamepadStatusPanel,
  LayoutSettingsPanel,
  StickSettingsPanel
} from './components/editor/SettingsPanels';

function EditorApp(): React.ReactElement {
  const { t } = useTranslation();
  const apiRef = useRef(new ApiClient());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadTargetRef = useRef<ImageUploadTarget>({ type: 'background' });
  const [layout, setLayout] = useState<Layout>(() => createDefaultLayout());
  const [layoutNames, setLayoutNames] = useState<LayoutEntry[]>([]);
  const [selectedLayout, setSelectedLayout] = useState('');
  const [layoutName, setLayoutName] = useState('mypreset');
  const [buttonMappings, setButtonMappings] = useState<ButtonMapping[]>(() => GamepadManager.createDefaultButtonMappings());
  const [stickMappings, setStickMappings] = useState<StickMapping[]>(() => GamepadManager.createDefaultStickMappings());
  const [previewScale, setPreviewScale] = useState(1);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(null);
  const [language, setLanguage] = useState(i18n.language);
  const {
    assigningTarget,
    assignmentName,
    cancelAssignment,
    connected,
    gamepadName,
    resetSnapshot,
    snapshot,
    startAssignment
  } = useEditorGamepad({
    api: apiRef.current,
    layout,
    buttonMappings,
    stickMappings,
    setButtonMappings,
    setStickMappings,
    connectGamepadMessage: t('connectGamepadFirst')
  });

  const obsUrl = `${SERVER_URL}/view`;

  const refreshLayouts = useCallback(async () => {
    try {
      const layouts = await apiRef.current.getLayouts();
      setLayoutNames(layouts);
      return layouts;
    } catch (error) {
      console.error('Failed to load layout list:', error);
      return [];
    }
  }, []);

  const applyLayout = useCallback((data: Layout, name?: string) => {
    const nextLayout = ensureLayoutDefaults(data);
    setLayout(nextLayout);
    resetSnapshot(nextLayout);
    setButtonMappings(data.buttonMappings || GamepadManager.createDefaultButtonMappings());
    setStickMappings(data.stickMappings || GamepadManager.createDefaultStickMappings());
    if (name) setLayoutName(name);
  }, [resetSnapshot]);

  useEffect(() => {
    let cancelled = false;
    const loadDefaultLayout = async () => {
      try {
        const defaultLayout = await apiRef.current.getDefaultLayout();
        const layoutName = defaultLayout.name || 'preset';
        const data = await apiRef.current.getLayout(layoutName);
        if (!cancelled && data) {
          applyLayout(data, layoutName);
        }
        const entries = await refreshLayouts();
        if (!cancelled) {
          const entry = entries.find(e => e.name === layoutName);
          setSelectedLayout(entry ? layoutSelectionValue(entry.name, entry.builtin) : layoutName);
        }
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
      if (!next.buttons[index]) next.buttons[index] = createEmptyButtonLayout();
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
    const name = layoutNameFromSelection(selectedLayout);
    try {
      const data = await apiRef.current.getLayout(name);
      applyLayout(data, name);
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
    const uploadLayoutName = layout.name || 'custom';
    const dataUrl = await readFileAsDataUrl(file);

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

  const changeLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    localStorage.setItem('language', nextLanguage);
    i18n.changeLanguage(nextLanguage);
  };

  const exportLayout = () => {
    const data = cloneLayout(layout);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layoutName || 'layout'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importLayout = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        applyLayout(data, data.name || 'imported');
      } catch {
        window.alert('Invalid layout file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
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
          <Text size="xs" c="dimmed">{t('obsTip')}</Text>
        </div>

        <DisplaySettingsPanel
          language={language}
          previewScale={previewScale}
          backgroundOpacity={backgroundOpacity}
          onLanguageChange={changeLanguage}
          onPreviewScaleChange={setPreviewScale}
          onBackgroundOpacityChange={setBackgroundOpacity}
        />

        <StickSettingsPanel layout={layout} updateLayout={updateLayout} />

        <BackgroundSettingsPanel
          layout={layout}
          fileInputRef={fileInputRef}
          updateLayout={updateLayout}
          uploadImage={uploadImage}
          openImagePicker={openImagePicker}
        />

        <ButtonSettingsPanel
          layout={layout}
          assigningTarget={assigningTarget}
          assignmentName={assignmentName}
          selectedButtonIndex={selectedButtonIndex}
          updateLayout={updateLayout}
          setSelectedButtonIndex={setSelectedButtonIndex}
          openImagePicker={openImagePicker}
          cancelAssignment={cancelAssignment}
        />

        <LayoutSettingsPanel
          layoutNames={layoutNames}
          selectedLayout={selectedLayout}
          layoutName={layoutName}
          setSelectedLayout={setSelectedLayout}
          setLayoutName={setLayoutName}
          loadLayout={loadLayout}
          saveLayout={saveLayout}
          setDefaultLayout={setDefaultLayout}
          exportLayout={exportLayout}
          importLayout={importLayout}
        />

        <GamepadStatusPanel connected={connected} gamepadName={gamepadName} />
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
