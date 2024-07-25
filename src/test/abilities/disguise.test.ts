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

describe("Abilities - DISGUISE", () => {
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
    game.override.ability(Abilities.DISGUISE);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  test(
    "check if fainted pokemon switched to base form on arena reset",
    async () => {
      const baseForm = 0,
        bustedForm = 1;
      game.override.startingWave(4);
      game.override.starterForms({
        [Species.MIMIKYU]: bustedForm,
      });

      await game.startBattle([Species.MAGIKARP, Species.MIMIKYU]);

      const mimikyu = game.scene.getParty().find((p) => p.species.speciesId === Species.MIMIKYU);
      expect(mimikyu).not.toBe(undefined);
      expect(mimikyu.formIndex).toBe(bustedForm);

      mimikyu.hp = 0;
      mimikyu.status = new Status(StatusEffect.FAINT);
      expect(mimikyu.isFainted()).toBe(true);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.doKillOpponents();
      await game.phaseInterceptor.to(TurnEndPhase);
      game.doSelectModifier();
      await game.phaseInterceptor.to(QuietFormChangePhase);

      expect(mimikyu.formIndex).toBe(baseForm);
    },
    TIMEOUT
  );

  test(
    "damage taken should be equal to 1/8 of its maximum HP, rounded down",
    async () => {
      const baseForm = 0,
        bustedForm = 1;

      game.override.enemyMoveset([Moves.DARK_PULSE, Moves.DARK_PULSE, Moves.DARK_PULSE, Moves.DARK_PULSE]);
      game.override.startingLevel(20);
      game.override.enemyLevel(20);
      game.override.enemySpecies(Species.MAGIKARP);
      game.override.starterForms({
        [Species.MIMIKYU]: baseForm,
      });

      await game.startBattle([Species.MIMIKYU]);

      const mimikyu = game.scene.getPlayerPokemon();
      const damage = (Math.floor(mimikyu.getMaxHp()/8));

      expect(mimikyu).not.toBe(undefined);
      expect(mimikyu.formIndex).toBe(baseForm);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(mimikyu.formIndex).toBe(bustedForm);
      expect(game.scene.getEnemyPokemon().turnData.currDamageDealt).toBe(damage);
    },
    TIMEOUT
  );
});
