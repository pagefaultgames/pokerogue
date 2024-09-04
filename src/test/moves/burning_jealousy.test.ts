import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { StatusEffect } from "#app/enums/status-effect";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

const TIMEOUT = 20 * 1000;

describe("Moves - Burning Jealousy", () => {
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
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.ICE_SCALES)
      .enemyMoveset(Array(4).fill(Moves.HOWL))
      .startingLevel(10)
      .enemyLevel(10)
      .starterSpecies(Species.FEEBAS)
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.BURNING_JEALOUSY, Moves.GROWL]);

  });

  it("should burn the opponent if their stat stages were raised", async () => {
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.BURNING_JEALOUSY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.status?.effect).toBe(StatusEffect.BURN);
  }, TIMEOUT);

  it("should still burn the opponent if their stat stages were both raised and lowered in the same turn", async () => {
    game.override
      .starterSpecies(0)
      .battleType("double");
    await game.classicMode.startBattle([Species.FEEBAS, Species.ABRA]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.BURNING_JEALOUSY);
    game.move.select(Moves.GROWL, 1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.status?.effect).toBe(StatusEffect.BURN);
  }, TIMEOUT);

  it("should ignore stat stages raised by IMPOSTER", async () => {
    game.override
      .enemySpecies(Species.DITTO)
      .enemyAbility(Abilities.IMPOSTER)
      .enemyMoveset(SPLASH_ONLY);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.BURNING_JEALOUSY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.status?.effect).toBeUndefined();
  }, TIMEOUT);

  it.skip("should ignore weakness policy", async () => { // TODO: Make this test if WP is implemented
    await game.classicMode.startBattle();
  }, TIMEOUT);

  it("should be boosted by Sheer Force even if opponent didn't raise stat stages", async () => {
    game.override
      .ability(Abilities.SHEER_FORCE)
      .enemyMoveset(SPLASH_ONLY);
    vi.spyOn(allMoves[Moves.BURNING_JEALOUSY], "calculateBattlePower");
    await game.classicMode.startBattle();

    game.move.select(Moves.BURNING_JEALOUSY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(allMoves[Moves.BURNING_JEALOUSY].calculateBattlePower).toHaveReturnedWith(allMoves[Moves.BURNING_JEALOUSY].power * 5461 / 4096);
  }, TIMEOUT);
});
