import { BattlerTagType } from "#app/enums/battler-tag-type";
import { StatusEffect } from "#app/enums/status-effect";
import { VictoryPhase } from "#app/phases/victory-phase";
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
      .startingLevel(100)
      .enemyMoveset([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ])
      .enemyLevel(1);
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
    await game.move.forceStatusActivation(false);
    await game.phaseInterceptor.to(VictoryPhase);

    expect(playerPokemon.summonData.moveQueue.length).toBe(2);
    expect(playerPokemon.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(true);

    await game.toNextWave();

    await game.move.forceStatusActivation(true);
    await game.toNextWave();

    expect(playerPokemon.summonData.moveQueue.length).toBe(0);
    expect(playerPokemon.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(false);
  });
});
