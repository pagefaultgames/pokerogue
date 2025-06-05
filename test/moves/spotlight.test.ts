import { BattlerIndex } from "#app/battle";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
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
      .starterSpecies(Species.AMOONGUSS)
      .enemySpecies(Species.SNORLAX)
      .startingLevel(100)
      .enemyLevel(100)
      .moveset([Moves.FOLLOW_ME, Moves.RAGE_POWDER, Moves.SPOTLIGHT, Moves.QUICK_ATTACK])
      .enemyMoveset([Moves.FOLLOW_ME, Moves.SPLASH]);
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
