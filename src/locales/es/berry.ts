import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const berry: SimpleTranslationEntries = {
    "Restores_25%_HP_if_HP_is_below_50%": "Restores 25% HP if HP is below 50%",
    "Cures_any_non-volatile_status_condition_and_confusion": "Cures any non-volatile status condition and confusion",
    "Restores_25%_HP_if_hit_by_a_super_effective_move": "Restores 25% HP if hit by a super effective move",
    "Raises": "Raises {{battleStatName}} if HP is below 25%",
    "Raises_critical_hit_ratio_if_HP_is_below_25%": "Raises critical hit ratio if HP is below 25%",
    "Sharply_raises_a_random_stat_if_HP_is_below_25%": "Sharply raises a random stat if HP is below 25%",
    "Restores_10_PP_to_a_move_if_its_PP_reaches_0": "Restores 10 PP to a move if its PP reaches 0",
    "restored_PP_to_its_move": "restored PP to its move {{moveName}}\nusing its {{berryType}}!",
    "restored_its_HP": "'s {{berryName}}\n restored its HP!",
    "Berry": "{{berryTypeString}} Berry"
} as const;