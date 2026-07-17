// biome-ignore assist/source/organizeImports: DOM setup must load before React DOM.
import { componentDom } from "./component-dom";
import { MantineProvider } from "@mantine/core";
import { render, type RenderResult } from "@testing-library/react";
import i18next from "i18next";
import type React from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

const testI18n = i18next.createInstance().use(initReactI18next);
void testI18n.init({
  lng: "en",
  initImmediate: false,
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

export function renderComponent(component: React.ReactNode): RenderResult {
  return render(
    <I18nextProvider i18n={testI18n}>
      <MantineProvider>{component}</MantineProvider>
    </I18nextProvider>,
  );
}

export const componentDocument = componentDom.window.document;
