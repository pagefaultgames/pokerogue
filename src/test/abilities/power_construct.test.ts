import { Status, StatusEffect } from "#app/data/status-effect.js";
import { QuietFormChangePhase } from "#app/form-change-phase.js";
import { TurnEndPhase } from "#app/phases.js";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - POWER CONSTRUCT", () => {
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
    game.override.ability(Abilities.POWER_CONSTRUCT);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  test(
    "check if fainted pokemon switches to base form on arena reset",
    async () => {
      const baseForm = 2,
        completeForm = 4;
      game.override.startingWave(4);
      game.override.starterForms({
        [Species.ZYGARDE]: completeForm,
      });

      await game.startBattle([Species.MAGIKARP, Species.ZYGARDE]);

      const zygarde = game.scene.getParty().find((p) => p.species.speciesId === Species.ZYGARDE);
      expect(zygarde).not.toBe(undefined);
      expect(zygarde.formIndex).toBe(completeForm);

      zygarde.hp = 0;
      zygarde.status = new Status(StatusEffect.FAINT);
      expect(zygarde.isFainted()).toBe(true);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.doKillOpponents();
      await game.phaseInterceptor.to(TurnEndPhase);
      game.doSelectModifier();
      await game.phaseInterceptor.to(QuietFormChangePhase);

      expect(zygarde.formIndex).toBe(baseForm);
    },
    TIMEOUT
  );
});
