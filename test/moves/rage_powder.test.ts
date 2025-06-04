import { BattlerIndex } from "#app/battle";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Moves - Rage Powder", () => {
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
    game.override.battleStyle("double");
    game.override.enemySpecies(SpeciesId.SNORLAX);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.moveset([MoveId.FOLLOW_ME, MoveId.RAGE_POWDER, MoveId.SPOTLIGHT, MoveId.QUICK_ATTACK]);
    game.override.enemyMoveset([MoveId.RAGE_POWDER, MoveId.TACKLE, MoveId.SPLASH]);
  });

  test("move effect should be bypassed by Grass type", async () => {
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS, SpeciesId.VENUSAUR]);

    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.QUICK_ATTACK, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);

    await game.move.selectEnemyMove(MoveId.RAGE_POWDER);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.phaseInterceptor.to("BerryPhase", false);

    // If redirection was bypassed, both enemies should be damaged
    expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
    expect(enemyPokemon[1].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
  });

  test("move effect should be bypassed by Overcoat", async () => {
    game.override.ability(AbilityId.OVERCOAT);

    // Test with two non-Grass type player Pokemon
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const enemyPokemon = game.scene.getEnemyField();

    const enemyStartingHp = enemyPokemon.map(p => p.hp);

    game.move.select(MoveId.QUICK_ATTACK, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);

    await game.move.selectEnemyMove(MoveId.RAGE_POWDER);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.phaseInterceptor.to("BerryPhase", false);

    // If redirection was bypassed, both enemies should be damaged
    expect(enemyPokemon[0].hp).toBeLessThan(enemyStartingHp[0]);
    expect(enemyPokemon[1].hp).toBeLessThan(enemyStartingHp[1]);
  });
});
