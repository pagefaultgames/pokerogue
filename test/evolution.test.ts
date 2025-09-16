import { pokemonEvolutions, SpeciesFormEvolution, SpeciesWildEvolutionDelay } from "#balance/pokemon-evolutions";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import * as Utils from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Evolution", () => {
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

    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(60);
  });

  it("should keep hidden ability after evolving", async () => {
    await game.classicMode.runToSummon([SpeciesId.EEVEE, SpeciesId.TRAPINCH]);

    const [eevee, trapinch] = game.scene.getPlayerParty();
    eevee.abilityIndex = 2;
    trapinch.abilityIndex = 2;

    await eevee.evolve(pokemonEvolutions[SpeciesId.EEVEE][6], eevee.getSpeciesForm());
    expect(eevee.abilityIndex).toBe(2);

    await trapinch.evolve(pokemonEvolutions[SpeciesId.TRAPINCH][0], trapinch.getSpeciesForm());
    expect(trapinch.abilityIndex).toBe(1);
  });

  it("should keep same ability slot after evolving", async () => {
    await game.classicMode.runToSummon([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER]);

    const [bulbasaur, charmander] = game.scene.getPlayerParty();
    bulbasaur.abilityIndex = 0;
    charmander.abilityIndex = 1;

    await bulbasaur.evolve(pokemonEvolutions[SpeciesId.BULBASAUR][0], bulbasaur.getSpeciesForm());
    expect(bulbasaur.abilityIndex).toBe(0);

    await charmander.evolve(pokemonEvolutions[SpeciesId.CHARMANDER][0], charmander.getSpeciesForm());
    expect(charmander.abilityIndex).toBe(1);
  });

  it("should handle illegal abilityIndex values", async () => {
    await game.classicMode.runToSummon([SpeciesId.SQUIRTLE]);

    const squirtle = game.field.getPlayerPokemon();
    squirtle.abilityIndex = 5;

    await squirtle.evolve(pokemonEvolutions[SpeciesId.SQUIRTLE][0], squirtle.getSpeciesForm());
    expect(squirtle.abilityIndex).toBe(0);
  });

  it("should handle nincada's unique evolution", async () => {
    await game.classicMode.runToSummon([SpeciesId.NINCADA]);

    const nincada = game.field.getPlayerPokemon();
    nincada.abilityIndex = 2;
    nincada.metBiome = -1;
    nincada.gender = 1;

    await nincada.evolve(pokemonEvolutions[SpeciesId.NINCADA][0], nincada.getSpeciesForm());
    const [ninjask, shedinja] = game.scene.getPlayerParty();
    expect(ninjask.abilityIndex).toBe(2);
    expect(shedinja.abilityIndex).toBe(1);
    expect(ninjask.gender).toBe(1);
    expect(shedinja.gender).toBe(-1);
    // Regression test for https://github.com/pagefaultgames/pokerogue/issues/3842
    expect(shedinja.metBiome).toBe(-1);
  });

  it("should set wild delay to NONE by default", () => {
    const speciesFormEvo = new SpeciesFormEvolution(SpeciesId.ABRA, null, null, 1000, null, null);

    expect(speciesFormEvo.wildDelay).toBe(SpeciesWildEvolutionDelay.NONE);
  });

  it("should increase both HP and max HP when evolving", async () => {
    game.override
      .moveset([MoveId.SURF])
      .enemySpecies(SpeciesId.GOLEM)
      .enemyMoveset(MoveId.SPLASH)
      .startingWave(21)
      .startingLevel(16)
      .enemyLevel(50);

    await game.classicMode.startBattle([SpeciesId.TOTODILE]);

    const totodile = game.field.getPlayerPokemon();
    const hpBefore = totodile.hp;

    expect(totodile.hp).toBe(totodile.getMaxHp());

    const golem = game.field.getEnemyPokemon();
    golem.hp = 1;

    expect(golem.hp).toBe(1);

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("EndEvolutionPhase");

    expect(totodile.hp).toBe(totodile.getMaxHp());
    expect(totodile.hp).toBeGreaterThan(hpBefore);
  });

  it("should not fully heal HP when evolving", async () => {
    game.override
      .moveset([MoveId.SURF])
      .enemySpecies(SpeciesId.GOLEM)
      .enemyMoveset(MoveId.SPLASH)
      .startingWave(21)
      .startingLevel(13)
      .enemyLevel(30);

    await game.classicMode.startBattle([SpeciesId.CYNDAQUIL]);

    const cyndaquil = game.field.getPlayerPokemon();
    cyndaquil.hp = Math.floor(cyndaquil.getMaxHp() / 2);
    const hpBefore = cyndaquil.hp;
    const maxHpBefore = cyndaquil.getMaxHp();

    expect(cyndaquil.hp).toBe(Math.floor(cyndaquil.getMaxHp() / 2));

    const golem = game.field.getEnemyPokemon();
    golem.hp = 1;

    expect(golem.hp).toBe(1);

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("EndEvolutionPhase");

    expect(cyndaquil.getMaxHp()).toBeGreaterThan(maxHpBefore);
    expect(cyndaquil.hp).toBeGreaterThan(hpBefore);
    expect(cyndaquil.hp).toBeLessThan(cyndaquil.getMaxHp());
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
    await game.classicMode.startBattle([SpeciesId.TANDEMAUS]); // starts us off with a tandemaus
    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.level = 25; // tandemaus evolves at level 25
    vi.spyOn(Utils, "randSeedInt").mockReturnValue(0); // setting the random generator to be 0 to force a three family maushold
    const threeForm = playerPokemon.getEvolution()!;
    expect(threeForm.evoFormKey).toBe("three"); // as per pokemon-forms, the evoFormKey for 3 family mausholds is "three"
    for (let f = 1; f < 4; f++) {
      vi.spyOn(Utils, "randSeedInt").mockReturnValue(f); // setting the random generator to 1, 2 and 3 to force 4 family mausholds
      const fourForm = playerPokemon.getEvolution()!;
      expect(fourForm.evoFormKey).toBe("four"); // meanwhile, according to the pokemon-forms, the evoFormKey for a 4 family maushold is "four"
    }
  });

  it("tyrogue should evolve if move is not in first slot", async () => {
    game.override
      .moveset([MoveId.TACKLE, MoveId.RAPID_SPIN, MoveId.LOW_KICK])
      .enemySpecies(SpeciesId.GOLEM)
      .enemyMoveset(MoveId.SPLASH)
      .startingWave(41)
      .startingLevel(19)
      .enemyLevel(30);

    await game.classicMode.startBattle([SpeciesId.TYROGUE]);

    const tyrogue = game.field.getPlayerPokemon();

    const golem = game.field.getEnemyPokemon();
    golem.hp = 1;
    expect(golem.hp).toBe(1);

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("EndEvolutionPhase");

    expect(tyrogue.species.speciesId).toBe(SpeciesId.HITMONTOP);
  });
});
