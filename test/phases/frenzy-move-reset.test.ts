import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Frenzy Move Reset", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .starterSpecies(SpeciesId.MAGIKARP)
      .moveset(MoveId.THRASH)
      .statusEffect(StatusEffect.PARALYSIS)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  /*
   * Thrash (or frenzy moves in general) should not continue to run if attack fails due to paralysis
   *
   * This is a 3-turn Thrash test:
   * 1. Thrash is selected and succeeds to hit the enemy -> Enemy Faints
   *
   * 2. Thrash is automatically selected but misses due to paralysis
   * Note: After missing the Pokemon should stop automatically attacking
   *
   * 3. At the start of the 3rd turn the Player should be able to select a move/switch Pokemon/etc.
   * Note: This means that BattlerTag.FRENZY is not anymore in pokemon.summonData.tags and pokemon.summonData.moveQueue is empty
   *
   */
  it("should cancel frenzy move if move fails turn 2", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.THRASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceStatusActivation(false);
    await game.toNextTurn();

    expect(playerPokemon.summonData.moveQueue.length).toBe(2);
    expect(playerPokemon.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(true);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceStatusActivation(true);
    await game.toNextTurn();

    expect(playerPokemon.summonData.moveQueue.length).toBe(0);
    expect(playerPokemon.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(false);
  });
});
