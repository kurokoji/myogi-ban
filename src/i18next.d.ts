import "i18next";
import type { jaTranslation } from "./translations/ja";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof jaTranslation };
  }
}
