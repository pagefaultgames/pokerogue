import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const battleStat: SimpleTranslationEntries = {
  "critical-hit_ratio": "暴击率",
  "Attack": "攻击",
  "Defense": "防御",
  "Sp_Atk": "特攻",
  "Sp_Def": "特防",
  "Speed": "速度",
  "Accuracy": "命中率",
  "Evasiveness": "闪避率",
  "rose": "小幅上升",
  "sharply_rose": "大幅上升",
  "rose_drastically": "显著上升",
  "fell": "小幅降低",
  "harshly_fell": "大幅降低",
  "severly_fell": "显著降低",
  "levelChangeDescripion":"的 {{statsFragment}} {{description}}",
  "won_'t_go_any_higher": "无法再上升",
  "won_'t_go_any_lower": "无法再降低"
} as const;