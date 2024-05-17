import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const berry: SimpleTranslationEntries = {
    "Restores_25%_HP_if_HP_is_below_50%": "如果HP低于50%，恢复25%的HP",
    "Cures_any_non-volatile_status_condition_and_confusion": "治愈任何非易失性状态异常和混乱状态",
    "Restores_25%_HP_if_hit_by_a_super_effective_move": "如果受到超有效的攻击，恢复25%的HP",
    "Raises": "如果HP低于25%,提升 {{battleStatName}}",
    "Raises_critical_hit_ratio_if_HP_is_below_25%": "如果HP低于25%，提升击中要害的概率",
    "Sharply_raises_a_random_stat_if_HP_is_below_25%": "如果HP低于25%，大幅提升一项随机能力值",
    "Restores_10_PP_to_a_move_if_its_PP_reaches_0": "如果技能的PP降至0，恢复10点PP",
    "restored_PP_to_its_move": "使用 {{berryType}}\n恢复了技能  {{moveName}} 的PP！",
    "restored_its_HP": "的 {{berryName}}\n恢复了HP！",
    "Berry": "{{berryTypeString}} 浆果"
} as const;