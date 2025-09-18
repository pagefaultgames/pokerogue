import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { isBetween, toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Analytic", () => {
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
      .moveset([MoveId.SPLASH, MoveId.TACKLE])
      .ability(AbilityId.ANALYTIC)
      .battleStyle("single")
      .criticalHits(false)
      .startingLevel(200)
      .enemyLevel(200)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should increase damage if the user moves last", async () => {
    await game.classicMode.startBattle([SpeciesId.ARCEUS]);

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();
    const damage1 = enemy.getInverseHp();
    enemy.hp = enemy.getMaxHp();

    game.move.select(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(isBetween(enemy.getInverseHp(), toDmgValue(damage1 * 1.3) - 3, toDmgValue(damage1 * 1.3) + 3)).toBe(true);
  });

  it("should increase damage only if the user moves last in doubles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.GENGAR, SpeciesId.SHUCKLE]);

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.TACKLE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toNextTurn();
    const damage1 = enemy.getInverseHp();
    enemy.hp = enemy.getMaxHp();

    game.move.select(MoveId.TACKLE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    expect(isBetween(enemy.getInverseHp(), toDmgValue(damage1 * 1.3) - 3, toDmgValue(damage1 * 1.3) + 3)).toBe(true);
    enemy.hp = enemy.getMaxHp();

    game.move.select(MoveId.TACKLE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemy.getInverseHp()).toBe(damage1);
  });
});
