export interface Localizable {
  localize(): void;
}

export interface SimpleTranslationEntries {
  [key: string]: string;
}

export interface MoveTranslationEntry {
  name: string;
  effect: string;
}

export interface MoveTranslationEntries {
  [key: string]: MoveTranslationEntry;
}

export interface AbilityTranslationEntry {
  name: string;
  description: string;
}

export interface AbilityTranslationEntries {
  [key: string]: AbilityTranslationEntry;
}

export interface RewardTranslationEntry {
  name?: string;
  description?: string;
  extra?: SimpleTranslationEntries;
}

export interface RewardTranslationEntries {
  Reward: { [key: string]: RewardTranslationEntry };
  SpeciesBoosterItem: { [key: string]: RewardTranslationEntry };
  AttackTypeBoosterItem: SimpleTranslationEntries;
  TempStatStageBoosterItem: SimpleTranslationEntries;
  BaseStatBoosterItem: SimpleTranslationEntries;
  EvolutionItem: SimpleTranslationEntries;
  FormChangeItemId: SimpleTranslationEntries;
}

export interface PokemonInfoTranslationEntries {
  Stat: SimpleTranslationEntries;
  Type: SimpleTranslationEntries;
}

export interface BerryTranslationEntry {
  name: string;
  effect: string;
}

export interface BerryTranslationEntries {
  [key: string]: BerryTranslationEntry;
}

export interface StatusEffectTranslationEntries {
  [key: string]: StatusEffectTranslationEntry;
}

export interface StatusEffectTranslationEntry {
  name: string;
  obtain: string;
  obtainSource: string;
  activation: string;
  overlap: string;
  heal: string;
  description: string;
}

export interface AchievementTranslationEntry {
  name?: string;
  description?: string;
}

export interface AchievementTranslationEntries {
  [key: string]: AchievementTranslationEntry;
}

export interface DialogueTranslationEntry {
  [key: number]: string;
}

export interface DialogueTranslationCategory {
  [category: string]: DialogueTranslationEntry;
}

export interface DialogueTranslationEntries {
  [trainertype: string]: DialogueTranslationCategory;
}
