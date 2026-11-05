import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Honey Gather", () => {
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
      .moveset([MoveId.SPLASH, MoveId.ROAR, MoveId.THUNDERBOLT])
      .startingLevel(100)
      .ability(AbilityId.HONEY_GATHER)
      .passiveAbility(AbilityId.RUN_AWAY)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it.todo("should give a chance to find honey after a battle", async () => {
    await game.classicMode.startBattle(SpeciesId.MILOTIC);
    game.scene.money = 1000;

    game.move.select(MoveId.THUNDERBOLT);
    await game.toNextWave();

    expect(game.scene.money).toBeGreaterThan(1000);
  });
});
