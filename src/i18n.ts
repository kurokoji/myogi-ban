import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { enTranslation } from "./translations/en";
import { jaTranslation } from "./translations/ja";

export const resources = {
  ja: { translation: jaTranslation },
  en: { translation: enTranslation },
};

const savedLanguage = localStorage.getItem("language") || "ja";
i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: "ja",
  interpolation: { escapeValue: false },
});

export default i18n;
