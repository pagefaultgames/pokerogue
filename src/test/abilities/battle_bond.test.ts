import { Status, StatusEffect } from "#app/data/status-effect";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - BATTLE BOND", () => {
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
    const moveToUse = Moves.SPLASH;
    game.override.battleType("single");
    game.override.ability(Abilities.BATTLE_BOND);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  test(
    "check if fainted pokemon switches to base form on arena reset",
    async () => {
      const baseForm = 1;
      const ashForm = 2;
      game.override.startingWave(4);
      game.override.starterForms({
        [Species.GRENINJA]: ashForm,
      });

      await game.startBattle([Species.MAGIKARP, Species.GRENINJA]);

      const greninja = game.scene.getParty().find((p) => p.species.speciesId === Species.GRENINJA);
      expect(greninja).toBeDefined();
      expect(greninja!.formIndex).toBe(ashForm);

      greninja!.hp = 0;
      greninja!.status = new Status(StatusEffect.FAINT);
      expect(greninja!.isFainted()).toBe(true);

      game.move.select(Moves.SPLASH);
      await game.doKillOpponents();
      await game.phaseInterceptor.to(TurnEndPhase);
      game.doSelectModifier();
      await game.phaseInterceptor.to(QuietFormChangePhase);

      expect(greninja!.formIndex).toBe(baseForm);
    },
    TIMEOUT
  );
});
