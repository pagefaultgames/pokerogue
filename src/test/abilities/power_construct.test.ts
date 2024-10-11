import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import * as Overrides from "#app/overrides";
import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import { Status, StatusEffect } from "#app/data/status-effect.js";
import { TurnEndPhase } from "#app/phases.js";
import { QuietFormChangePhase } from "#app/form-change-phase.js";

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
    vi.spyOn(Overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.POWER_CONSTRUCT);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  test(
    "check if fainted pokemon switches to base form on arena reset",
    async () => {
      const baseForm = 2,
        completeForm = 4;
      vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(4);
      vi.spyOn(Overrides, "STARTER_FORM_OVERRIDES", "get").mockReturnValue({
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
