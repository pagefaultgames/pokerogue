export type SupportedLanguageEntry = {
  readonly [key: string]: { readonly label: string; readonly hasAllLocalizedImages: boolean };
};

export const SUPPORTED_LANGUAGE_ENTRIES = {
  en: {
    label: "English",
    hasAllLocalizedImages: true,
  },
  "es-ES": {
    label: "Español (ES)", // Spanish (Spain)
    hasAllLocalizedImages: true,
  },
  "es-419": {
    label: "Español (LATAM)", // LATAM Spanish
    hasAllLocalizedImages: true,
  },
  fr: {
    label: "Français", // French
    hasAllLocalizedImages: true,
  },
  de: {
    label: "Deutsch", // German
    hasAllLocalizedImages: true,
  },
  it: {
    label: "Italiano", // Italian
    hasAllLocalizedImages: true,
  },
  "pt-BR": {
    label: "Português (BR)", // Brazilian Portuguese
    hasAllLocalizedImages: true,
  },
  ko: {
    label: "한국어", // Korean
    hasAllLocalizedImages: true,
  },
  ja: {
    label: "日本語", // Japanese
    hasAllLocalizedImages: true,
  },
  "zh-Hans": {
    label: "简体中文", // Chinese Simplified
    hasAllLocalizedImages: true,
  },
  "zh-Hant": {
    label: "繁體中文", // Chinese Traditional
    hasAllLocalizedImages: true,
  },
  th: {
    label: "ไทย", // Thai
    hasAllLocalizedImages: true,
  },
  ca: {
    label: "Català (Needs Help)", // Catalan
    hasAllLocalizedImages: true,
  },
  eu: {
    label: "Euskara (Needs Help)", // Basque
    hasAllLocalizedImages: true,
  },
  tr: {
    label: "Türkçe (Needs Help)", // Turkish
    hasAllLocalizedImages: true,
  },
  ru: {
    label: "Русский (Needs Help)", // Russian
    hasAllLocalizedImages: true,
  },
  uk: {
    label: "Українська (Needs Help)", // Ukrainian
    hasAllLocalizedImages: true,
  },
  pl: {
    label: "Polski (Needs Help)", // Polish
    hasAllLocalizedImages: true,
  },
  id: {
    label: "Bahasa Indonesia (Needs Help)", // Indonesian
    hasAllLocalizedImages: true,
  },
  hi: {
    label: "हिन्दी (Needs Help)", // Hindi
    hasAllLocalizedImages: true,
  },
  vi: {
    label: "Tiếng Việt", // Vietnamese
    hasAllLocalizedImages: true,
  },
  da: {
    label: "Dansk (Needs Help)", // Danish
    hasAllLocalizedImages: true,
  },
  sv: {
    label: "Svenska", // Swedish
    hasAllLocalizedImages: true,
  },
  tl: {
    label: "Tagalog (Needs Help)", // Tagalog
    hasAllLocalizedImages: true,
  },
} as const satisfies SupportedLanguageEntry;

export const SUPPORTED_LANGUAGES = Object.keys(SUPPORTED_LANGUAGE_ENTRIES) as SupportedLanguage[];

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGE_ENTRIES;
