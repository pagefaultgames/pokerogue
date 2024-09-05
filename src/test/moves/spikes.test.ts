import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";


describe("Moves - Spikes", () => {
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
      .battleType("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .ability(Abilities.BALL_FETCH)
      .enemyMoveset(SPLASH_ONLY)
      .moveset([Moves.SPIKES, Moves.SPLASH, Moves.ROAR]);
  });

  it("should not damage the team that set them", async () => {
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    game.move.select(Moves.SPIKES);
    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    const player = game.scene.getParty()[0];
    expect(player.hp).toBe(player.getMaxHp());
  }, 20000);

  it("should damage opposing pokemon that are forced to switch in", async () => {
    game.override.startingWave(5);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    game.move.select(Moves.SPIKES);
    await game.toNextTurn();

    game.move.select(Moves.ROAR);
    await game.toNextTurn();

    const enemy = game.scene.getEnemyParty()[0];
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  }, 20000);

  it("should damage opposing pokemon that choose to switch in", async () => {
    game.override.startingWave(5);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    game.move.select(Moves.SPIKES);
    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    game.forceEnemyToSwitch();
    await game.toNextTurn();

    const enemy = game.scene.getEnemyParty()[0];
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  }, 20000);

});
