import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { menu as enMenu } from '../locales/en/menu';
import { menu as esMenu } from '../locales/es/menu';
import { menu as itMenu } from '../locales/it/menu';
import { menu as frMenu } from '../locales/fr/menu';
import { menu as deMenu } from '../locales/de/menu';

import { menuUiHandler as enMenuUiHandler } from '../locales/en/menu-ui-handler.js';
import { menuUiHandler as esMenuUiHandler } from '../locales/es/menu-ui-handler.js';
import { menuUiHandler as frMenuUiHandler } from '../locales/fr/menu-ui-handler.js';
import { menuUiHandler as itMenuUiHandler } from '../locales/it/menu-ui-handler.js';
import { menuUiHandler as deMenuUiHandler } from '../locales/de/menu-ui-handler.js';

import { battle as enBattle } from '../locales/en/battle';
import { battle as esBattle } from '../locales/es/battle';
import { battle as itBattle } from '../locales/it/battle';
import { battle as frBattle } from '../locales/fr/battle';
import { battle as deBattle } from '../locales/de/battle';

import { move as enMove } from '../locales/en/move';
import { move as esMove } from '../locales/es/move';
import { move as frMove } from '../locales/fr/move';
import { move as deMove } from '../locales/de/move';

import { ability as enAbility } from '../locales/en/ability';
import { ability as esAbility } from '../locales/es/ability';
import { ability as frAbility } from '../locales/fr/ability';
import { ability as deAbility } from '../locales/de/ability';

import { pokeball as enPokeball } from '../locales/en/pokeball';
import { pokeball as esPokeball } from '../locales/es/pokeball';
import { pokeball as frPokeball } from '../locales/fr/pokeball';
import { pokeball as dePokeball } from '../locales/de/pokeball';

import { pokemon as enPokemon } from '../locales/en/pokemon';
import { pokemon as esPokemon } from '../locales/es/pokemon';
import { pokemon as frPokemon } from '../locales/fr/pokemon';
import { pokemon as dePokemon } from '../locales/de/pokemon';

import { pokemonStat as enPokemonStat } from '../locales/en/pokemon-stat';
import { pokemonStat as esPokemonStat } from '../locales/es/pokemon-stat';
import { pokemonStat as frPokemonStat } from '../locales/fr/pokemon-stat';
import { pokemonStat as itPokemonStat } from '../locales/it/pokemon-stat';
import { pokemonStat as dePokemonStat } from '../locales/de/pokemon-stat';

import { commandUiHandler as enCommandUiHandler } from '../locales/en/command-ui-handler';
import { commandUiHandler as esCommandUiHandler } from '../locales/es/command-ui-handler';
import { commandUiHandler as frCommandUiHandler } from '../locales/fr/command-ui-handler';
import { commandUiHandler as deCommandUiHandler } from '../locales/de/command-ui-handler';

import { fightUiHandler as enFightUiHandler } from '../locales/en/fight-ui-handler';
import { fightUiHandler as esFightUiHandler } from '../locales/es/fight-ui-handler';
import { fightUiHandler as frFightUiHandler } from '../locales/fr/fight-ui-handler';
import { fightUiHandler as itFightUiHandler } from '../locales/it/fight-ui-handler';
import { fightUiHandler as deFightUiHandler } from '../locales/de/fight-ui-handler';

import { tutorial as enTutorial } from '../locales/en/tutorial';
import { tutorial as esTutorial } from '../locales/es/tutorial';
import { tutorial as frTutorial } from '../locales/fr/tutorial';
import { tutorial as itTutorial} from '../locales/it/tutorial';
import { tutorial as deTutorial } from '../locales/de/tutorial';

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
      },
      it: {
        menu: itMenu,
        menuUiHandler: itMenuUiHandler,
        battle: itBattle,
        pokemonStat: itPokemonStat,
        fightUiHandler: itFightUiHandler,
        tutorial: itTutorial,
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
    };
  }
}

export default i18next;
