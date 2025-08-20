import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Spec - Pokemon Functions", () => {
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
      .startingLevel(100)
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  describe("doSetStatus", () => {
    it("should change the Pokemon's status, ignoring feasibility checks", async () => {
      await game.classicMode.startBattle([SpeciesId.ACCELGOR]);

      const player = game.field.getPlayerPokemon();

      expect(player.status?.effect).toBeUndefined();
      player.doSetStatus(StatusEffect.BURN);
      expect(player.status?.effect).toBe(StatusEffect.BURN);

      expect(player.canSetStatus(StatusEffect.SLEEP)).toBe(false);
      player.doSetStatus(StatusEffect.SLEEP, 5);
      expect(player.status?.effect).toBe(StatusEffect.SLEEP);
      expect(player.status?.sleepTurnsRemaining).toBe(5);
    });
  });
});
