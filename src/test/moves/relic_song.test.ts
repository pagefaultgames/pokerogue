import { Type } from "#app/data/type";
import { Challenges } from "#app/enums/challenges";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Relic Song", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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
      .moveset([Moves.RELIC_SONG, Moves.SPLASH])
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .enemySpecies(Species.MAGIKARP)
      .enemyLevel(100);
  });

  it("swaps Meloetta's form between Aria and Pirouette", async () => {
    await game.classicMode.startBattle([Species.MELOETTA]);

    const meloetta = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.RELIC_SONG);
    await game.toNextTurn();

    expect(meloetta.formIndex).toBe(1);

    game.move.select(Moves.RELIC_SONG);
    await game.phaseInterceptor.to("BerryPhase");

    expect(meloetta.formIndex).toBe(0);
  }, TIMEOUT);

  it("doesn't swap Meloetta's form during a mono-type challenge", async () => {
    game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, Type.PSYCHIC + 1, 0);
    await game.challengeMode.startBattle([Species.MELOETTA]);

    const meloetta = game.scene.getPlayerPokemon()!;

    expect(meloetta.formIndex).toBe(0);

    game.move.select(Moves.RELIC_SONG);
    await game.phaseInterceptor.to("BerryPhase");
    await game.toNextTurn();

    expect(meloetta.formIndex).toBe(0);
  }, TIMEOUT);

  it("doesn't swap Meloetta's form during biome change (arena reset)", async () => {
    game.override
      .starterForms({[Species.MELOETTA]: 1})
      .startingWave(10);
    await game.classicMode.startBattle([Species.MELOETTA]);

    const meloetta = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(meloetta.formIndex).toBe(1);
  }, TIMEOUT);
});
