import { Status, StatusEffect } from "#app/data/status-effect";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - SHIELDS DOWN", () => {
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
    game.override.ability(Abilities.SHIELDS_DOWN);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  test(
    "check if fainted pokemon switched to base form on arena reset",
    async () => {
      const meteorForm = 0,
        coreForm = 7;
      game.override.startingWave(4);
      game.override.starterForms({
        [Species.MINIOR]: coreForm,
      });

      await game.startBattle([Species.MAGIKARP, Species.MINIOR]);

      const minior = game.scene.getParty().find((p) => p.species.speciesId === Species.MINIOR)!;
      expect(minior).not.toBe(undefined);
      expect(minior.formIndex).toBe(coreForm);

      minior.hp = 0;
      minior.status = new Status(StatusEffect.FAINT);
      expect(minior.isFainted()).toBe(true);

      game.move.select(Moves.SPLASH);
      await game.doKillOpponents();
      await game.phaseInterceptor.to(TurnEndPhase);
      game.doSelectModifier();
      await game.phaseInterceptor.to(QuietFormChangePhase);

      expect(minior.formIndex).toBe(meteorForm);
    },
    TIMEOUT
  );
});
