import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const statusEffectHealText: SimpleTranslationEntries = {
  poison: "was\ncured of its poison!",
  paralysis: "was\nhealed of paralysis!",
  sleep: "woke up!",
  freeze: "was\ndefrosted!",
  burn: "was\nhealed of its burn!",
};

export const statusEffectDescriptor: SimpleTranslationEntries = {
  poison: "poisoning",
  paralysis: "paralysis",
  sleep: "sleep",
  freeze: "freezing",
  burn: "burn",
};

export const statusEffectObtainText: SimpleTranslationEntries = {
  poison: "\nwas poisoned{{sourceClause}}!",
  toxic: "\nwas badly poisoned{{sourceClause}}!",
  paralysis: " was paralyzed{{sourceClause}}!\nIt may be unable to move!",
  sleep: "\nfell asleep{{sourceClause}}!",
  freeze: "\nwas frozen solid{{sourceClause}}!",
  burn: "\nwas burned{{sourceClause}}!",
};

export const statusEffectActivationText: SimpleTranslationEntries = {
  poison: " is hurt\nby poison!",
  paralysis: " is paralyzed!\nIt can't move!",
  sleep: " is fast asleep.",
  freeze: " is\nfrozen solid!",
  burn: " is hurt\nby its burn!",
};

export const statusEffectOverlapText: SimpleTranslationEntries = {
  poison: " is\nalready poisoned!",
  paralysis: " is\nalready paralyzed!",
  sleep: " is\nalready asleep!",
  freeze: " is\nalready frozen!",
  burn: " is\nalready burned!",
};

export const statusEffectSourceClause: SimpleTranslationEntries = {
  by: "by",
  from: "from",
};
