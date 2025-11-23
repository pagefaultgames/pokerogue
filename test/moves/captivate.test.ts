import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Captivate", () => {
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
	  .enemySpecies(SpeciesId.NIDORAN_M)
	  .startingLevel(1)
	  .moveset(MoveId.SPLASH)
	  .enemyMoveset(MoveId.CAPTIVATE)
	  .criticalHits(false);
  });

  it("Lowers special attack by two stages when all targets are valid", async () => {
	// arrange
	await game.classicMode.startBattle([SpeciesId.NIDORAN_F, SpeciesId.NIDORAN_F]);
	const [playerNidoran1, playerNidoran2] = game.scene.getPlayerField();

	// act
	game.move.forceEnemyMove(MoveId.CAPTIVATE, BattlerIndex.ENEMY_2);
	await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
	await game.toEndOfTurn();

	// assert
	expect(playerNidoran1.getStatStage(Stat.SPATK)).toEqual(2);
	expect(playerNidoran2.getStatStage(Stat.SPATK)).toEqual(2);
  });

  // Wrong gender

  // 1 wrong gender

  // Oblivious
});
