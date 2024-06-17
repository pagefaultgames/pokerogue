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
        PGFachv: AchievementTranslationEntries;
        PGMdialogue: DialogueTranslationEntries;
        PGFdialogue: DialogueTranslationEntries;
        PGMbattleSpecDialogue: SimpleTranslationEntries;
        PGFbattleSpecDialogue: SimpleTranslationEntries;
        PGMmiscDialogue: SimpleTranslationEntries;
        PGFmiscDialogue: SimpleTranslationEntries;
        PGMdoubleBattleDialogue: DialogueTranslationEntries;
        PGFdoubleBattleDialogue: DialogueTranslationEntries;
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
        settings: SimpleTranslationEntries;
        splashMessages: SimpleTranslationEntries;
        starterSelectUiHandler: SimpleTranslationEntries;
        titles: SimpleTranslationEntries;
        trainerClasses: SimpleTranslationEntries;
        trainerNames: SimpleTranslationEntries;
        tutorial: SimpleTranslationEntries;
        voucher: SimpleTranslationEntries;
        weather: SimpleTranslationEntries;
      };
    }
  }
