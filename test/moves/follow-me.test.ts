import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Moves - Follow Me", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SNORLAX)
      .startingLevel(100)
      .enemyLevel(100)
      .moveset([MoveId.FOLLOW_ME, MoveId.RAGE_POWDER, MoveId.SPOTLIGHT, MoveId.QUICK_ATTACK])
      .enemyMoveset([MoveId.TACKLE, MoveId.FOLLOW_ME, MoveId.SPLASH]);
  });

  test("move should redirect enemy attacks to the user", async () => {
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS, SpeciesId.CHARIZARD]);

    const playerPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.FOLLOW_ME);
    game.move.select(MoveId.QUICK_ATTACK, 1, BattlerIndex.ENEMY);

    // Force both enemies to target the player Pokemon that did not use Follow Me
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to(TurnEndPhase, false);

    expect(playerPokemon[0].hp).toBeLessThan(playerPokemon[0].getMaxHp());
    expect(playerPokemon[1].hp).toBe(playerPokemon[1].getMaxHp());
  });

  test("move should redirect enemy attacks to the first ally that uses it", async () => {
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS, SpeciesId.CHARIZARD]);

    const playerPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.FOLLOW_ME);
    game.move.select(MoveId.FOLLOW_ME, 1);

    // Each player is targeted by an enemy
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to(TurnEndPhase, false);

    playerPokemon.sort((a, b) => a.getEffectiveStat(Stat.SPD) - b.getEffectiveStat(Stat.SPD));

    expect(playerPokemon[1].hp).toBeLessThan(playerPokemon[1].getMaxHp());
    expect(playerPokemon[0].hp).toBe(playerPokemon[0].getMaxHp());
  });

  test("move effect should be bypassed by Stalwart", async () => {
    game.override.ability(AbilityId.STALWART).moveset([MoveId.QUICK_ATTACK]);

    await game.classicMode.startBattle([SpeciesId.AMOONGUSS, SpeciesId.CHARIZARD]);

    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.QUICK_ATTACK, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);

    // Target doesn't need to be specified if the move is self-targeted
    await game.move.selectEnemyMove(MoveId.FOLLOW_ME);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase, false);

    // If redirection was bypassed, both enemies should be damaged
    expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
    expect(enemyPokemon[1].hp).toBeLessThan(enemyPokemon[1].getMaxHp());
  });

  test("move effect should be bypassed by Snipe Shot", async () => {
    game.override.moveset([MoveId.SNIPE_SHOT]);

    await game.classicMode.startBattle([SpeciesId.AMOONGUSS, SpeciesId.CHARIZARD]);

    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.SNIPE_SHOT, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SNIPE_SHOT, 1, BattlerIndex.ENEMY_2);

    await game.move.selectEnemyMove(MoveId.FOLLOW_ME);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase, false);

    // If redirection was bypassed, both enemies should be damaged
    expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
    expect(enemyPokemon[1].hp).toBeLessThan(enemyPokemon[1].getMaxHp());
  });
});
