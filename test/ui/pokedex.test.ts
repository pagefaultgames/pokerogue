import { Mode } from "#app/ui/ui";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import PokedexUiHandler from "#app/ui/pokedex-ui-handler";
import { FilterTextRow } from "#app/ui/filter-text";
import { allAbilities } from "#app/data/ability";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import { allSpecies, getPokemonSpecies, type PokemonForm } from "#app/data/pokemon-species";
import { Button } from "#enums/buttons";
import { DropDownColumn } from "#app/ui/filter-bar";
import type PokemonSpecies from "#app/data/pokemon-species";
import { PokemonType } from "#enums/pokemon-type";

/**
 * Return all permutations of elements from an array
 */
function permutations<T>(array: T[], length: number): T[][] {
  if (length === 0) {
    return [[]];
  }
  return array.flatMap((item, index) =>
    permutations([...array.slice(0, index), ...array.slice(index + 1)], length - 1).map(perm => [item, ...perm]),
  );
}

describe("UI - Pokedex", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const mocks: MockInstance[] = [];

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    while (mocks.length > 0) {
      mocks.pop()?.mockRestore();
    }
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  /**
   * Run the game to open the pokedex UI.
   * @returns The handler for the pokedex UI.
   */
  async function runToOpenPokedex(): Promise<PokedexUiHandler> {
    // Open the pokedex UI.
    await game.runToTitle();

    await game.phaseInterceptor.setOverlayMode(Mode.POKEDEX);

    // Get the handler for the current UI.
    const handler = game.scene.ui.getHandler();
    expect(handler).toBeInstanceOf(PokedexUiHandler);

    return handler as PokedexUiHandler;
  }

  /**
   * Compute a set of pokemon that have a specific ability in allAbilities
   * @param ability - The ability to filter for
   */
  function getSpeciesWithAbility(ability: Abilities): Set<Species> {
    const speciesSet = new Set<Species>();
    for (const pkmn of allSpecies) {
      if (
        [pkmn.ability1, pkmn.ability2, pkmn.getPassiveAbility(), pkmn.abilityHidden].includes(ability) ||
        pkmn.forms.some(form =>
          [form.ability1, form.ability2, form.abilityHidden, form.getPassiveAbility()].includes(ability),
        )
      ) {
        speciesSet.add(pkmn.speciesId);
      }
    }
    return speciesSet;
  }

  /**
   * Compute a set of pokemon that have one of the specified type(s)
   *
   * Includes all forms of the pokemon
   * @param types - The types to filter for
   */
  function getSpeciesWithType(...types: PokemonType[]): Set<Species> {
    const speciesSet = new Set<Species>();
    const tySet = new Set<PokemonType>(types);

    // get the pokemon and its forms
    outer: for (const pkmn of allSpecies) {
      // @ts-ignore We know that type2 might be null.
      if (tySet.has(pkmn.type1) || tySet.has(pkmn.type2)) {
        speciesSet.add(pkmn.speciesId);
        continue;
      }
      for (const form of pkmn.forms) {
        // @ts-ignore We know that type2 might be null.
        if (tySet.has(form.type1) || tySet.has(form.type2)) {
          speciesSet.add(pkmn.speciesId);
          continue outer;
        }
      }
    }
    return speciesSet;
  }

  /**
   * Create mocks for the abilities of a species.
   * This is used to set the abilities of a species to a specific value.
   * All abilities are optional. Not providing one will set it to NONE.
   *
   * This will override the ability of the pokemon species only, unless set forms is true
   *
   * @param species - The species to set the abilities for
   * @param ability - The ability to set for the first ability
   * @param ability2 - The ability to set for the second ability
   * @param hidden - The ability to set for the hidden ability
   * @param passive - The ability to set for the passive ability
   * @param setForms - Whether to also overwrite the abilities for each of the species' forms (defaults to `true`)
   */
  function createAbilityMocks(
    species: Species,
    {
      ability = Abilities.NONE,
      ability2 = Abilities.NONE,
      hidden = Abilities.NONE,
      passive = Abilities.NONE,
      setForms = true,
    }: {
      ability?: Abilities;
      ability2?: Abilities;
      hidden?: Abilities;
      passive?: Abilities;
      setForms?: boolean;
    },
  ) {
    const pokemon = getPokemonSpecies(species);
    const checks: [PokemonSpecies | PokemonForm] = [pokemon];
    if (setForms) {
      checks.push(...pokemon.forms);
    }
    for (const p of checks) {
      mocks.push(vi.spyOn(p, "ability1", "get").mockReturnValue(ability));
      mocks.push(vi.spyOn(p, "ability2", "get").mockReturnValue(ability2));
      mocks.push(vi.spyOn(p, "abilityHidden", "get").mockReturnValue(hidden));
      mocks.push(vi.spyOn(p, "getPassiveAbility").mockReturnValue(passive));
    }
  }

  /***************************
   *    Tests for Filters    *
   ***************************/

  it("should filter to show only the pokemon with an ability when filtering by ability", async () => {
    // await game.importData("test/testUtils/saves/everything.prsv");
    const pokedexHandler = await runToOpenPokedex();

    // Get name of overgrow
    const overgrow = allAbilities[Abilities.OVERGROW].name;

    // @ts-ignore filterText is private
    pokedexHandler.filterText.setValue(FilterTextRow.ABILITY_1, overgrow);

    // filter all species to be the pokemon that have overgrow
    const overgrowSpecies = getSpeciesWithAbility(Abilities.OVERGROW);
    // @ts-expect-error - `filteredPokemonData` is private
    const filteredSpecies = new Set(pokedexHandler.filteredPokemonData.map(pokemon => pokemon.species.speciesId));

    expect(filteredSpecies).toEqual(overgrowSpecies);
  });

  it("should filter to show only pokemon with ability and passive when filtering by 2 abilities", async () => {
    // Setup mocks for the ability and passive combinations
    const whitelist: Species[] = [];
    const blacklist: Species[] = [];

    const filter_ab1 = Abilities.OVERGROW;
    const filter_ab2 = Abilities.ADAPTABILITY;
    const ab1_instance = allAbilities[filter_ab1];
    const ab2_instance = allAbilities[filter_ab2];

    // Create a species with passive set and each "ability" field
    const baseObj = {
      ability: Abilities.BALL_FETCH,
      ability2: Abilities.NONE,
      hidden: Abilities.BLAZE,
      passive: Abilities.TORRENT,
    };

    // Mock pokemon to have the exhaustive combination of the two selected abilities
    const attrs: (keyof typeof baseObj)[] = ["ability", "ability2", "hidden", "passive"];
    for (const [idx, value] of permutations(attrs, 2).entries()) {
      createAbilityMocks(Species.BULBASAUR + idx, {
        ...baseObj,
        [value[0]]: filter_ab1,
        [value[1]]: filter_ab2,
      });
      if (value.includes("passive")) {
        whitelist.push(Species.BULBASAUR + idx);
      } else {
        blacklist.push(Species.BULBASAUR + idx);
      }
    }

    const pokedexHandler = await runToOpenPokedex();

    // @ts-ignore filterText is private
    pokedexHandler.filterText.setValue(FilterTextRow.ABILITY_1, ab1_instance.name);
    // @ts-ignore filterText is private
    pokedexHandler.filterText.setValue(FilterTextRow.ABILITY_2, ab2_instance.name);

    let whiteListCount = 0;
    // @ts-ignore filteredPokemonData is private
    for (const species of pokedexHandler.filteredPokemonData) {
      expect(blacklist, "entry must have one of the abilities as a passive").not.toContain(species.species.speciesId);

      const rawAbility = [species.species.ability1, species.species.ability2, species.species.abilityHidden];
      const rawPassive = species.species.getPassiveAbility();

      const c1 = rawPassive === ab1_instance.id && rawAbility.includes(ab2_instance.id);
      const c2 = c1 || (rawPassive === ab2_instance.id && rawAbility.includes(ab1_instance.id));

      expect(c2, "each filtered entry should have the ability and passive combination").toBe(true);
      if (whitelist.includes(species.species.speciesId)) {
        whiteListCount++;
      }
    }

    expect(whiteListCount).toBe(whitelist.length);
  });

  it("should filter to show only the pokemon with a type when filtering by a single type", async () => {
    const pokedexHandler = await runToOpenPokedex();

    // @ts-ignore filterBar is private
    pokedexHandler.filterBar.getFilter(DropDownColumn.TYPES).toggleOptionState(PokemonType.NORMAL + 1);

    const expectedPokemon = getSpeciesWithType(PokemonType.NORMAL);
    // @ts-expect-error - `filteredPokemonData` is private
    const filteredPokemon = new Set(pokedexHandler.filteredPokemonData.map(pokemon => pokemon.species.speciesId));

    expect(filteredPokemon).toEqual(expectedPokemon);
  });

  // Todo: Pokemon with a mega that adds a type do not show up in the filter, e.g. pinsir.
  it.todo("should show only the pokemon with one of the types when filtering by multiple types", async () => {
    const pokedexHandler = await runToOpenPokedex();

    // @ts-ignore filterBar is private
    pokedexHandler.filterBar.getFilter(DropDownColumn.TYPES).toggleOptionState(PokemonType.NORMAL + 1);
    // @ts-ignore filterBar is private
    pokedexHandler.filterBar.getFilter(DropDownColumn.TYPES).toggleOptionState(PokemonType.FLYING + 1);

    const expectedPokemon = getSpeciesWithType(PokemonType.NORMAL, PokemonType.FLYING);
    // @ts-expect-error - `filteredPokemonData` is private
    const filteredPokemon = new Set(pokedexHandler.filteredPokemonData.map(pokemon => pokemon.species.speciesId));

    expect(filteredPokemon).toEqual(expectedPokemon);
  });

  /****************************
   *    Tests for UI Input    *
   ****************************/

  // TODO: fix cursor wrapping
  it.todo(
    "should wrap the cursor to the top when moving to an empty entry when there are more than 81 pokemon",
    async () => {
      const pokedexHandler = await runToOpenPokedex();

      // Filter by gen 2 so we can pan a specific amount.
      // @ts-ignore filterText is private
      pokedexHandler.filterBar.getFilter(DropDownColumn.GEN).options[2].toggleOptionState();
      pokedexHandler.updateStarters();
      // @ts-ignore filteredPokemonData is private
      expect(pokedexHandler.filteredPokemonData.length, "pokemon in gen2").toBe(100);

      // Let's try to pan to the right to see what the pokemon it points to is.

      // pan to the right once and down 11 times
      pokedexHandler.processInput(Button.RIGHT);
      // Nab the pokemon that is selected for comparison later.

      // @ts-expect-error - `lastSpecies` is private
      const selectedPokemon = pokedexHandler.lastSpecies.speciesId;
      for (let i = 0; i < 11; i++) {
        pokedexHandler.processInput(Button.DOWN);
      }

      // @ts-ignore lastSpecies is private
      expect(selectedPokemon).toEqual(pokedexHandler.lastSpecies.speciesId);
    },
  );
});
