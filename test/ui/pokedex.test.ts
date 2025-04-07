import { Mode } from "#app/ui/ui";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import PokedexUiHandler from "#app/ui/pokedex-ui-handler";
import { FilterTextRow } from "#app/ui/filter-text";
import { allAbilities } from "#app/data/ability";
import { Abilities } from "#enums/abilities";
import type { Species } from "#enums/species";
import { allSpecies } from "#app/data/pokemon-species";
import { Button } from "#enums/buttons";
import { DropDownColumn } from "#app/ui/filter-bar";

describe("UI - Pokedex", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
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
   * @param abilty The ability to filter for
   */
  function getSpeciesWithAbility(abilty: Abilities): Set<Species> {
    const speciesSet = new Set<Species>();
    for (const pkmn of allSpecies) {
      if (
        [pkmn.ability1, pkmn.ability2, pkmn.getPassiveAbility(), pkmn.abilityHidden].includes(abilty) ||
        pkmn.forms.some(form =>
          [form.ability1, form.ability2, form.abilityHidden, form.getPassiveAbility()].includes(abilty),
        )
      ) {
        speciesSet.add(pkmn.speciesId);
      }
    }
    return speciesSet;
  }

  it("should filter to show only the pokemon with an ability when filtering by ability", async () => {
    // await game.importData("test/testUtils/saves/everything.prsv");
    const pokedexHandler = await runToOpenPokedex();

    // Get name of overgrow
    const overgrow = allAbilities[Abilities.OVERGROW].name;

    // @ts-ignore filterText is private
    pokedexHandler.filterText.setValue(FilterTextRow.ABILITY_1, overgrow);

    // filter all species to be the pokemon that have overgrow
    const overgrowSpecies = getSpeciesWithAbility(Abilities.OVERGROW);
    // @ts-ignore
    const filteredSpecies = new Set(pokedexHandler.filteredPokemonData.map(pokemon => pokemon.species.speciesId));

    expect(filteredSpecies).toEqual(overgrowSpecies);
  });

  it.todo(
    "should wrap the cursor to the top when moving to an empty entry when there are more than 81 pokemon",
    async () => {
      const pokedexHandler = await runToOpenPokedex();

      // Filter by gen 2 so we can pan a specific amount.
      // @ts-ignore filterText is private
      pokedexHandler.filterBar.getFilter(DropDownColumn.GEN).options[2].toggleOptionState();
      pokedexHandler.updateStarters();
      // @ts-ignore filteredPokemonData is private
      expect(pokedexHandler.filteredPokemonData.length, "Expecting gen2 to have 100 pokemon").toBe(100);

      // Let's try to pan to the right to see what the pokemon it points to is.

      // pan to the right once and down 11 times
      pokedexHandler.processInput(Button.RIGHT);
      // Nab the pokemon that is selected for comparison later.

      // @ts-ignore filteredPokemonData is private
      const selectedPokemon = pokedexHandler.lastSpecies.speciesId;
      for (let i = 0; i < 11; i++) {
        pokedexHandler.processInput(Button.DOWN);
      }

      // @ts-ignore lastSpecies is private
      const selectedPokemon2 = pokedexHandler.lastSpecies.speciesId;
      expect(selectedPokemon).toEqual(selectedPokemon2);
    },
  );
});
