import { AbilityTranslationEntries, SimpleTranslationEntries, AchievementTranslationEntries, BerryTranslationEntries, DialogueTranslationEntries, ModifierTypeTranslationEntries, MoveTranslationEntries, PokemonInfoTranslationEntries } from "#app/interfaces/locales";

// Module declared to make referencing keys in the localization files type-safe.
declare module "i18next" {
    interface CustomTypeOptions {
      defaultNS: "menu", // needed here as well for typedoc
      resources: {
        ability: AbilityTranslationEntries;
        abilityTriggers: SimpleTranslationEntries;
        achv: AchievementTranslationEntries;
        battle: SimpleTranslationEntries;
        battleMessageUiHandler: SimpleTranslationEntries;
        berry: BerryTranslationEntries;
        biome: SimpleTranslationEntries;
        challenges: SimpleTranslationEntries;
        commandUiHandler: SimpleTranslationEntries;
        PGMachv: AchievementTranslationEntries;
        PGMdialogue: DialogueTranslationEntries;
        PGMbattleSpecDialogue: SimpleTranslationEntries;
        PGMmiscDialogue: SimpleTranslationEntries;
        PGMdoubleBattleDialogue: DialogueTranslationEntries;
        PGFdialogue: DialogueTranslationEntries;
        PGFbattleSpecDialogue: SimpleTranslationEntries;
        PGFmiscDialogue: SimpleTranslationEntries;
        PGFdoubleBattleDialogue: DialogueTranslationEntries;
        PGFachv: AchievementTranslationEntries;
        egg: SimpleTranslationEntries;
        fightUiHandler: SimpleTranslationEntries;
        gameMode: SimpleTranslationEntries;
        gameStatsUiHandler: SimpleTranslationEntries;
        growth: SimpleTranslationEntries;
        menu: SimpleTranslationEntries;
        menuUiHandler: SimpleTranslationEntries;
        modifierType: ModifierTypeTranslationEntries;
        move: MoveTranslationEntries;
        nature: SimpleTranslationEntries;
        partyUiHandler: SimpleTranslationEntries;
        pokeball: SimpleTranslationEntries;
        pokemon: SimpleTranslationEntries;
        pokemonInfo: PokemonInfoTranslationEntries;
        pokemonInfoContainer: SimpleTranslationEntries;
        saveSlotSelectUiHandler: SimpleTranslationEntries;
        splashMessages: SimpleTranslationEntries;
        starterSelectUiHandler: SimpleTranslationEntries;
        titles: SimpleTranslationEntries;
        trainerClasses: SimpleTranslationEntries;
        trainerNames: SimpleTranslationEntries;
        tutorial: SimpleTranslationEntries;
        voucher: SimpleTranslationEntries;
        weather: SimpleTranslationEntries;
        statusEffectHealText: SimpleTranslationEntries;
        statusEffectDescriptor: SimpleTranslationEntries;
        statusEffectObtainText: SimpleTranslationEntries;
        statusEffectActivationText: SimpleTranslationEntries;
        statusEffectOverlapText: SimpleTranslationEntries;
        statusEffectSourceClause: SimpleTranslationEntries;
        arenaTag: SimpleTranslationEntries;
        battleStat: SimpleTranslationEntries;
      };
    }
  }
