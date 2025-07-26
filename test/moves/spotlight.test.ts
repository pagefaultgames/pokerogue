import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Moves - Spotlight", () => {
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
      .battleStyle("double")
      .starterSpecies(SpeciesId.AMOONGUSS)
      .enemySpecies(SpeciesId.SNORLAX)
      .startingLevel(100)
      .enemyLevel(100)
      .moveset([MoveId.FOLLOW_ME, MoveId.RAGE_POWDER, MoveId.SPOTLIGHT, MoveId.QUICK_ATTACK])
      .enemyMoveset([MoveId.FOLLOW_ME, MoveId.SPLASH]);
  });

  test("move should redirect attacks to the target", async () => {
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS, SpeciesId.CHARIZARD]);

    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.SPOTLIGHT, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);

    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase, false);

    expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
    expect(enemyPokemon[1].hp).toBe(enemyPokemon[1].getMaxHp());
  });

  test("move should cause other redirection moves to fail", async () => {
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS, SpeciesId.CHARIZARD]);

    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.SPOTLIGHT, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);

    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.FOLLOW_ME);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
    expect(enemyPokemon[1].hp).toBe(enemyPokemon[1].getMaxHp());
  });
});
