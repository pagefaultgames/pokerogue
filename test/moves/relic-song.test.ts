import { AbilityId } from "#enums/ability-id";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Relic Song", () => {
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
      .moveset([MoveId.RELIC_SONG, MoveId.SPLASH])
      .battleStyle("single")
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(100);
  });

  it("swaps Meloetta's form between Aria and Pirouette", async () => {
    await game.classicMode.startBattle([SpeciesId.MELOETTA]);

    const meloetta = game.field.getPlayerPokemon();

    game.move.select(MoveId.RELIC_SONG);
    await game.toNextTurn();

    expect(meloetta.formIndex).toBe(1);

    game.move.select(MoveId.RELIC_SONG);
    await game.phaseInterceptor.to("BerryPhase");

    expect(meloetta.formIndex).toBe(0);
  });

  it("doesn't swap Meloetta's form during a mono-type challenge", async () => {
    game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.PSYCHIC + 1, 0);
    await game.challengeMode.startBattle([SpeciesId.MELOETTA]);

    const meloetta = game.field.getPlayerPokemon();

    expect(meloetta.formIndex).toBe(0);

    game.move.select(MoveId.RELIC_SONG);
    await game.phaseInterceptor.to("BerryPhase");
    await game.toNextTurn();

    expect(meloetta.formIndex).toBe(0);
  });

  it("doesn't swap Meloetta's form during biome change (arena reset)", async () => {
    game.override.starterForms({ [SpeciesId.MELOETTA]: 1 }).startingWave(10);
    await game.classicMode.startBattle([SpeciesId.MELOETTA]);

    const meloetta = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(meloetta.formIndex).toBe(1);
  });
});
