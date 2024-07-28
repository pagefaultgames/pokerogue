import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Species } from "#app/enums/species.js";
import { Abilities } from "#app/enums/abilities.js";
import Overrides from "#app/overrides";
import { pokemonEvolutions } from "#app/data/pokemon-evolutions.js";

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

    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");

    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);

    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(60);
  });

  it("should keep hidden ability after evolving", async () => {
    await game.runToSummon([Species.EEVEE, Species.TRAPINCH]);

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
    await game.runToSummon([Species.BULBASAUR, Species.CHARMANDER]);

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
    await game.runToSummon([Species.SQUIRTLE]);

    const squirtle = game.scene.getPlayerPokemon();
    squirtle.abilityIndex = 5;

    squirtle.evolve(pokemonEvolutions[Species.SQUIRTLE][0], squirtle.getSpeciesForm());
    expect(squirtle.abilityIndex).toBe(0);
  }, TIMEOUT);

  it("should handle nincada's unique evolution", async () => {
    await game.runToSummon([Species.NINCADA]);

    const nincada = game.scene.getPlayerPokemon();
    nincada.abilityIndex = 2;

    nincada.evolve(pokemonEvolutions[Species.NINCADA][0], nincada.getSpeciesForm());
    const ninjask = game.scene.getParty()[0];
    const shedinja = game.scene.getParty()[1];
    expect(ninjask.abilityIndex).toBe(2);
    expect(shedinja.abilityIndex).toBe(1);
  }, TIMEOUT);
});
