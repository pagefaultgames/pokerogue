import { pokemonEvolutions, SpeciesFormEvolution, SpeciesWildEvolutionDelay } from "#app/data/pokemon-evolutions";
import { Abilities } from "#app/enums/abilities";
import { Species } from "#app/enums/species";
import * as Utils from "#app/utils";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Evolution", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 1000 * 20;

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

    game.override.battleType("single");

    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyAbility(Abilities.BALL_FETCH);

    game.override.startingLevel(60);
  });

  it("should keep hidden ability after evolving", async () => {
    await game.classicMode.runToSummon([Species.EEVEE, Species.TRAPINCH]);

    const eevee = game.scene.getParty()[0];
    const trapinch = game.scene.getParty()[1];
    eevee.abilityIndex = 2;
    trapinch.abilityIndex = 2;

    eevee.evolve(pokemonEvolutions[Species.EEVEE][6], eevee.getSpeciesForm());
    expect(eevee.abilityIndex).toBe(2);

    trapinch.evolve(pokemonEvolutions[Species.TRAPINCH][0], trapinch.getSpeciesForm());
    expect(trapinch.abilityIndex).toBe(1);
  }, TIMEOUT);

  it("should keep same ability slot after evolving", async () => {
    await game.classicMode.runToSummon([Species.BULBASAUR, Species.CHARMANDER]);

    const bulbasaur = game.scene.getParty()[0];
    const charmander = game.scene.getParty()[1];
    bulbasaur.abilityIndex = 0;
    charmander.abilityIndex = 1;

    bulbasaur.evolve(pokemonEvolutions[Species.BULBASAUR][0], bulbasaur.getSpeciesForm());
    expect(bulbasaur.abilityIndex).toBe(0);

    charmander.evolve(pokemonEvolutions[Species.CHARMANDER][0], charmander.getSpeciesForm());
    expect(charmander.abilityIndex).toBe(1);
  }, TIMEOUT);

  it("should handle illegal abilityIndex values", async () => {
    await game.classicMode.runToSummon([Species.SQUIRTLE]);

    const squirtle = game.scene.getPlayerPokemon()!;
    squirtle.abilityIndex = 5;

    squirtle.evolve(pokemonEvolutions[Species.SQUIRTLE][0], squirtle.getSpeciesForm());
    expect(squirtle.abilityIndex).toBe(0);
  }, TIMEOUT);

  it("should handle nincada's unique evolution", async () => {
    await game.classicMode.runToSummon([Species.NINCADA]);

    const nincada = game.scene.getPlayerPokemon()!;
    nincada.abilityIndex = 2;

    nincada.evolve(pokemonEvolutions[Species.NINCADA][0], nincada.getSpeciesForm());
    const ninjask = game.scene.getParty()[0];
    const shedinja = game.scene.getParty()[1];
    expect(ninjask.abilityIndex).toBe(2);
    expect(shedinja.abilityIndex).toBe(1);
  }, TIMEOUT);

  it("should set wild delay to NONE by default", () => {
    const speciesFormEvo = new SpeciesFormEvolution(Species.ABRA, null, null, 1000, null, null);

    expect(speciesFormEvo.wildDelay).toBe(SpeciesWildEvolutionDelay.NONE);
  });

  it("should handle rng-based split evolution", async () => {
    /* this test checks to make sure that tandemaus will
     * evolve into a 3 family maushold 25% of the time
     * and a 4 family maushold the other 75% of the time
     * This is done by using the getEvolution method in pokemon.ts
     * getEvolution will give back the form that the pokemon can evolve into
     * It does this by checking the pokemon conditions in pokemon-forms.ts
     * For tandemaus, the conditions are random due to a randSeedInt(4)
     * If the value is 0, it's a 3 family maushold, whereas if the value is
     * 1, 2 or 3, it's a 4 family maushold
     */
    await game.startBattle([Species.TANDEMAUS]); // starts us off with a tandemaus
    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.level = 25; // tandemaus evolves at level 25
    vi.spyOn(Utils, "randSeedInt").mockReturnValue(0); // setting the random generator to be 0 to force a three family maushold
    const threeForm = playerPokemon.getEvolution()!;
    expect(threeForm.evoFormKey).toBe("three"); // as per pokemon-forms, the evoFormKey for 3 family mausholds is "three"
    for (let f = 1; f < 4; f++) {
      vi.spyOn(Utils, "randSeedInt").mockReturnValue(f); // setting the random generator to 1, 2 and 3 to force 4 family mausholds
      const fourForm = playerPokemon.getEvolution()!;
      expect(fourForm.evoFormKey).toBe(null); // meanwhile, according to the pokemon-forms, the evoFormKey for a 4 family maushold is null
    }
  }, TIMEOUT);
});
