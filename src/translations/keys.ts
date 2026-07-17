import { jaTranslation } from "./ja";

export type TranslationKey = keyof typeof jaTranslation;
const translationKeys = new Set<string>(Object.keys(jaTranslation));

export function isTranslationKey(value: string): value is TranslationKey {
  return translationKeys.has(value);
}
