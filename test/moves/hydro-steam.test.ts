import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Hydro Steam", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.CHANSEY)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should do 1.5x damage in Harsh Sunlight", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.HYDRO_STEAM);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    const beforeDamage = enemy.getInverseHp();
    enemy.hp = enemy.getMaxHp();

    game.move.use(MoveId.SUNNY_DAY);
    await game.toNextTurn();
    game.move.use(MoveId.HYDRO_STEAM);
    await game.toEndOfTurn();

    const afterDamage = enemy.getInverseHp();

    expect(afterDamage).toBe(toDmgValue(beforeDamage * 1.5) + 1);
  });
});
