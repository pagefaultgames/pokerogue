export const FusionSettingKeys = {
  Stat_Formula: "FUSION_STAT_FORMULA",
  Shiny_Strength: "FUSION_SHINY_STRENGTH",
  Sprite_Source: "FUSION_SPRITE_SOURCE",
} as const;

export type FusionSettingKey = (typeof FusionSettingKeys)[keyof typeof FusionSettingKeys];

export interface FusionSettingOption {
  value: string;
  /** i18n key under `settings:` namespace. */
  labelKey: string;
}

export interface FusionSetting {
  key: FusionSettingKey;
  /** i18n key under `settings:` namespace. */
  labelKey: string;
  options: FusionSettingOption[];
  default: number;
}

// Order here is the row order in the Settings → Fusions tab. Append new
// settings at the bottom — stored indices must stay stable across versions.
export const FusionSettings: FusionSetting[] = [
  {
    key: FusionSettingKeys.Stat_Formula,
    labelKey: "settings:fusionStatFormula",
    options: [
      { value: "IF", labelKey: "settings:fusionStatFormulaIf" },
      { value: "POKEROGUE", labelKey: "settings:fusionStatFormulaPokerogue" },
      // MAXIMUM is strictly stronger than either parent; starter cost is bumped +1 in
      // `deriveFusionStarterCost` to compensate.
      { value: "MAXIMUM", labelKey: "settings:fusionStatFormulaMaximum" },
    ],
    default: 0,
  },
  {
    key: FusionSettingKeys.Shiny_Strength,
    labelKey: "settings:fusionShinyRecolor",
    options: [
      { value: "SUBTLE", labelKey: "settings:fusionShinyRecolorSubtle" },
      { value: "MODERATE", labelKey: "settings:fusionShinyRecolorModerate" },
      { value: "STRONG", labelKey: "settings:fusionShinyRecolorStrong" },
    ],
    default: 1,
  },
  {
    key: FusionSettingKeys.Sprite_Source,
    labelKey: "settings:fusionSpriteSource",
    options: [
      { value: "CUSTOM_FIRST", labelKey: "settings:fusionSpriteSourceArtistFirst" },
      { value: "AUTOGEN_FIRST", labelKey: "settings:fusionSpriteSourceAutogenFirst" },
      { value: "CUSTOM_ONLY", labelKey: "settings:fusionSpriteSourceArtistOnly" },
    ],
    default: 0,
  },
];

const STORAGE_KEY = "fusionSettings_v1";

let cache: Record<string, number> | null = null;

function ensureCache(): Record<string, number> {
  if (cache !== null) {
    return cache;
  }
  cache = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === "number" && Number.isFinite(v)) {
            cache[k] = v;
          }
        }
      }
    }
  } catch {
    // Quota / disabled storage / parse error — defaults apply.
  }
  return cache;
}

function findSetting(key: string): FusionSetting | undefined {
  return FusionSettings.find(s => s.key === key);
}

/** Falls back to `default` when unset or out-of-range (forward-compat for shrunk option lists). */
export function getFusionSettingIndex(key: FusionSettingKey): number {
  const setting = findSetting(key);
  if (!setting) {
    return 0;
  }
  const stored = ensureCache()[key];
  if (typeof stored === "number" && stored >= 0 && stored < setting.options.length) {
    return stored;
  }
  return setting.default;
}

/** Returns the stable string token; labels are localizable but values are not. */
export function getFusionSettingValue(key: FusionSettingKey): string {
  const setting = findSetting(key);
  if (!setting) {
    return "";
  }
  return setting.options[getFusionSettingIndex(key)].value;
}

export function setFusionSetting(key: FusionSettingKey, index: number): boolean {
  const setting = findSetting(key);
  if (!setting || index < 0 || index >= setting.options.length) {
    return false;
  }
  ensureCache()[key] = index;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Quota / disabled storage — in-memory state still wins for the session.
  }
  for (const listener of listeners) {
    try {
      listener(key);
    } catch {
      // Listener exceptions must not break setting persistence.
    }
  }
  return true;
}

type Listener = (key: FusionSettingKey) => void;
const listeners = new Set<Listener>();

export function onFusionSettingChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
