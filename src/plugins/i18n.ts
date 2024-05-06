import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { deConfig } from '#app/locales/de/config.js';
import { enConfig } from '#app/locales/en/config.js';
import { esConfig } from '#app/locales/es/config.js';
import { frConfig } from '#app/locales/fr/config.js';
import { itConfig } from '#app/locales/it/config.js';

import { growth as enGrowth } from '../locales/en/growth';
import { growth as esGrowth } from '../locales/es/growth';
import { growth as frGrowth } from '../locales/fr/growth';
import { growth as itGrowth } from '../locales/it/growth';
import { growth as deGrowth } from '../locales/de/growth';

export interface SimpleTranslationEntries {
  [key: string]: string
}

export interface MoveTranslationEntry {
  name: string,
  effect: string
}

export interface MoveTranslationEntries {
  [key: string]: MoveTranslationEntry
}

export interface AbilityTranslationEntry {
  name: string,
  description: string
}

export interface AbilityTranslationEntries {
  [key: string]: AbilityTranslationEntry
}

export interface Localizable {
  localize(): void;
}

export function initI18n(): void {
  let lang = '';

  if (localStorage.getItem('prLang'))
    lang = localStorage.getItem('prLang');

  /**
   * i18next is a localization library for maintaining and using translation resources.
   *
   * Q: How do I add a new language?
   * A: To add a new language, create a new folder in the locales directory with the language code.
   *    Each language folder should contain a file for each namespace (ex. menu.ts) with the translations.
   *    Don't forget to declare new language in `supportedLngs` i18next initializer
   *
   * Q: How do I add a new namespace?
   * A: To add a new namespace, create a new file in each language folder with the translations.
   *    Then update the `resources` field in the init() call and the CustomTypeOptions interface.
   *
   * Q: How do I make a language selectable in the settings?
   * A: In src/system/settings.ts, add a new case to the Setting.Language switch statement.
   */

  i18next.use(LanguageDetector).init({
    lng: lang,
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'it', 'de'],
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        menu: enMenu,
        menuUiHandler: enMenuUiHandler,
        battle: enBattle,
        move: enMove,
        ability: enAbility,
        pokeball: enPokeball,
        pokemon: enPokemon,
        pokemonStat: enPokemonStat,
        commandUiHandler: enCommandUiHandler,
        fightUiHandler: enFightUiHandler,
        tutorial: enTutorial,
        starterSelectUiHandler: enStarterSelectUiHandler,
        growth: enGrowth
        
      },
      es: {
        menu: esMenu,
        menuUiHandler: esMenuUiHandler,
        battle: esBattle,
        move: esMove,
        ability: esAbility,
        pokeball: esPokeball,
        pokemon: esPokemon,
        pokemonStat: esPokemonStat,
        commandUiHandler: esCommandUiHandler,
        fightUiHandler: esFightUiHandler,
        tutorial: esTutorial,
        starterSelectUiHandler: esStarterSelectUiHandler,
        growth: esGrowth
      },
      fr: {
        menu: frMenu,
        menuUiHandler: frMenuUiHandler,
        battle: frBattle,
        move: frMove,
        ability: frAbility,
        pokeball: frPokeball,
        pokemon: frPokemon,
        pokemonStat: frPokemonStat,
        commandUiHandler: frCommandUiHandler,
        fightUiHandler: frFightUiHandler,
        tutorial: frTutorial,
        starterSelectUiHandler: frStarterSelectUiHandler,
        growth: frGrowth
      },
      it: {
        menu: itMenu,
        menuUiHandler: itMenuUiHandler,
        battle: itBattle,
        move: itMove,
        ability: itAbility,
        pokeball: itPokeball,
        pokemon: itPokemon,
        pokemonStat: itPokemonStat,
        commandUiHandler: itCommandUiHandler,
        fightUiHandler: itFightUiHandler,
        tutorial: itTutorial,
        starterSelectUiHandler: itStarterSelectUiHandler,
        growth: itGrowth
      },
      de: {
        menu: deMenu,
        menuUiHandler: deMenuUiHandler,
        battle: deBattle,
        move: deMove,
        ability: deAbility,
        pokeball: dePokeball,
        pokemon: dePokemon,
        pokemonStat: dePokemonStat,
        commandUiHandler: deCommandUiHandler,
        fightUiHandler: deFightUiHandler,
        tutorial: deTutorial,
        starterSelectUiHandler: deStarterSelectUiHandler,
        growth: deGrowth
      }
    },
  });
}

// Module declared to make referencing keys in the localization files type-safe.
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      menu: typeof enMenu;
      menuUiHandler: typeof enMenuUiHandler;
      move: typeof enMove;
      battle: typeof enBattle,
      ability: typeof enAbility;
      pokeball: typeof enPokeball;
      pokemon: typeof enPokemon;
      pokemonStat: typeof enPokemonStat;
      commandUiHandler: typeof enCommandUiHandler;
      fightUiHandler: typeof enFightUiHandler;
      tutorial: typeof enTutorial;
      starterSelectUiHandler: typeof enStarterSelectUiHandler;
      growth: typeof enGrowth;
    };
  }
}

export default i18next;
