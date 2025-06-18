import { BattlerIndex } from "#enums/battler-index";
import { globalScene } from "#app/global-scene";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Mold Breaker", () => {
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
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.MOLD_BREAKER)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should turn off the ignore abilities arena variable after the user's move", async () => {
    game.override
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.MOLD_BREAKER)
      .moveset([MoveId.ERUPTION])
      .startingLevel(100)
      .enemyLevel(2);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const enemy = game.scene.getEnemyPokemon()!;

    expect(enemy.isFainted()).toBe(false);
    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase", true);
    expect(globalScene.arena.ignoreAbilities).toBe(false);
  });
});
