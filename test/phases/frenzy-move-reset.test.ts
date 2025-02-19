import { BattlerIndex } from "#app/battle";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { StatusEffect } from "#enums/status-effect";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

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
      .battleType("single")
      .disableCrits()
      .starterSpecies(Species.MAGIKARP)
      .moveset(Moves.THRASH)
      .statusEffect(StatusEffect.PARALYSIS)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(100)
      .enemySpecies(Species.SHUCKLE)
      .enemyAbility(Abilities.BALL_FETCH);
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

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.THRASH);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.move.forceStatusActivation(false);
    await game.toNextTurn();

    expect(playerPokemon.summonData.moveQueue.length).toBe(2);
    expect(playerPokemon.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(true);

    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.move.forceStatusActivation(true);
    await game.toNextTurn();

    expect(playerPokemon.summonData.moveQueue.length).toBe(0);
    expect(playerPokemon.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(false);
  });
});
