import i18next from 'i18next';
import { menu as enMenu } from '../locales/en/menu';
import { menu as esMenu } from '../locales/es/menu';
import { menu as itMenu } from '../locales/it/menu';
import { menu as frMenu } from '../locales/fr/menu';

import { move as enMove } from '../locales/en/move';
import { move as esMove } from '../locales/es/move';
import { move as frMove } from '../locales/fr/move';

import { pokeball as enPokeball } from '../locales/en/pokeball';
import { pokeball as esPokeball } from '../locales/es/pokeball';
import { pokeball as frPokeball } from '../locales/fr/pokeball';

import { pokemon as enPokemon } from '../locales/en/pokemon';
import { pokemon as esPokemon } from '../locales/es/pokemon';
import { pokemon as frPokemon } from '../locales/fr/pokemon';

import { pokemonStat as enPokemonStat } from '../locales/en/pokemon-stat';
import { pokemonStat as esPokemonStat } from '../locales/es/pokemon-stat';
import { pokemonStat as frPokemonStat } from '../locales/fr/pokemon-stat';
import { pokemonStat as itPokemonStat } from '../locales/it/pokemon-stat';

import { commandUiHandler as enCommandUiHandler } from '../locales/en/command-ui-handler';
import { commandUiHandler as esCommandUiHandler } from '../locales/es/command-ui-handler';
import { commandUiHandler as frCommandUiHandler } from '../locales/fr/command-ui-handler';

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

export interface Localizable {
  localize(): void;
}

const DEFAULT_LANGUAGE_OVERRIDE = '';

export function initI18n(): void {
  let lang = 'en';

  if (localStorage.getItem('prLang'))
    lang = localStorage.getItem('prLang');

  /**
   * i18next is a localization library for maintaining and using translation resources.
   * 
   * Q: How do I add a new language?
   * A: To add a new language, create a new folder in the locales directory with the language code.
   *    Each language folder should contain a file for each namespace (ex. menu.ts) with the translations.
   * 
   * Q: How do I add a new namespace?
   * A: To add a new namespace, create a new file in each language folder with the translations.
   *    Then update the `resources` field in the init() call and the CustomTypeOptions interface.
   */

  i18next.init({
    lng: DEFAULT_LANGUAGE_OVERRIDE ? DEFAULT_LANGUAGE_OVERRIDE : lang,
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        menu: enMenu,
        move: enMove,
        pokeball: enPokeball,
        pokemon: enPokemon,
        pokemonStat: enPokemonStat,
        commandUiHandler: enCommandUiHandler,
      },
      es: {
        menu: esMenu,
        move: esMove,
        pokeball: esPokeball,
        pokemon: esPokemon,
        pokemonStat: esPokemonStat,
        commandUiHandler: esCommandUiHandler,
      },
      fr: {
        menu: frMenu,
        move: frMove,
        pokeball: frPokeball,
        pokemon: frPokemon,
        pokemonStat: frPokemonStat,
        commandUiHandler: frCommandUiHandler,
      },
      it: {
        menu: itMenu,
        pokemonStat: itPokemonStat,
      },
    },
  });
}

// Module declared to make referencing keys in the localization files type-safe.
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      menu: typeof enMenu;
      move: typeof enMove;
      pokeball: typeof enPokeball;
      pokemon: typeof enPokemon;
      pokemonStat: typeof enPokemonStat;
      commandUiHandler: typeof enCommandUiHandler;
    };
  }
}

export default i18next;
