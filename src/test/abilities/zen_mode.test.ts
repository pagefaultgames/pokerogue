import { Stat } from "#app/data/pokemon-stat";
import { Status, StatusEffect } from "#app/data/status-effect.js";
import { QuietFormChangePhase } from "#app/form-change-phase";
import { CommandPhase, DamagePhase, EnemyCommandPhase, MessagePhase, PostSummonPhase, SwitchPhase, SwitchSummonPhase, TurnEndPhase, TurnInitPhase, TurnStartPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - ZEN MODE", () => {
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
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.ZEN_MODE);
    game.override.startingLevel(100);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  test(
    "not enough damage to change form",
    async () => {
      const moveToUse = Moves.SPLASH;
      await game.startBattle([Species.DARMANITAN]);
      game.scene.getParty()[0].stats[Stat.SPD] = 1;
      game.scene.getParty()[0].stats[Stat.HP] = 100;
      game.scene.getParty()[0].hp = 100;
      expect(game.scene.getParty()[0].formIndex).toBe(0);

      game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
        game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
      });
      game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
        const movePosition = getMovePosition(game.scene, 0, moveToUse);
        (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
      });
      await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(DamagePhase, false);
      // await game.phaseInterceptor.runFrom(DamagePhase).to(DamagePhase, false);
      const damagePhase = game.scene.getCurrentPhase() as DamagePhase;
      damagePhase.updateAmount(40);
      await game.phaseInterceptor.runFrom(DamagePhase).to(TurnEndPhase, false);
      expect(game.scene.getParty()[0].hp).toBeLessThan(100);
      expect(game.scene.getParty()[0].formIndex).toBe(0);
    },
    TIMEOUT
  );

  test(
    "enough damage to change form",
    async () => {
      const moveToUse = Moves.SPLASH;
      await game.startBattle([Species.DARMANITAN]);
      game.scene.getParty()[0].stats[Stat.SPD] = 1;
      game.scene.getParty()[0].stats[Stat.HP] = 1000;
      game.scene.getParty()[0].hp = 100;
      expect(game.scene.getParty()[0].formIndex).toBe(0);

      game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
        game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
      });
      game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
        const movePosition = getMovePosition(game.scene, 0, moveToUse);
        (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
      });
      await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(QuietFormChangePhase);
      await game.phaseInterceptor.to(TurnInitPhase, false);
      expect(game.scene.getParty()[0].hp).not.toBe(100);
      expect(game.scene.getParty()[0].formIndex).not.toBe(0);
    },
    TIMEOUT
  );

  test(
    "kill pokemon while on zen mode",
    async () => {
      const moveToUse = Moves.SPLASH;
      await game.startBattle([Species.DARMANITAN, Species.CHARIZARD]);
      game.scene.getParty()[0].stats[Stat.SPD] = 1;
      game.scene.getParty()[0].stats[Stat.HP] = 1000;
      game.scene.getParty()[0].hp = 100;
      expect(game.scene.getParty()[0].formIndex).toBe(0);

      game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
        game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
      });
      game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
        const movePosition = getMovePosition(game.scene, 0, moveToUse);
        (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
      });
      await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(DamagePhase, false);
      // await game.phaseInterceptor.runFrom(DamagePhase).to(DamagePhase, false);
      const damagePhase = game.scene.getCurrentPhase() as DamagePhase;
      damagePhase.updateAmount(80);
      await game.phaseInterceptor.runFrom(DamagePhase).to(QuietFormChangePhase);
      expect(game.scene.getParty()[0].hp).not.toBe(100);
      expect(game.scene.getParty()[0].formIndex).not.toBe(0);
      await game.killPokemon(game.scene.getParty()[0]);
      expect(game.scene.getParty()[0].isFainted()).toBe(true);
      await game.phaseInterceptor.run(MessagePhase);
      await game.phaseInterceptor.run(EnemyCommandPhase);
      await game.phaseInterceptor.run(TurnStartPhase);
      game.onNextPrompt("SwitchPhase", Mode.PARTY, () => {
        game.scene.unshiftPhase(new SwitchSummonPhase(game.scene, 0, 1, false, false));
        game.scene.ui.setMode(Mode.MESSAGE);
      });
      game.onNextPrompt("SwitchPhase", Mode.MESSAGE, () => {
        game.endPhase();
      });
      await game.phaseInterceptor.run(SwitchPhase);
      await game.phaseInterceptor.to(PostSummonPhase);
      expect(game.scene.getParty()[1].formIndex).toBe(1);
    },
    TIMEOUT
  );

  test(
    "check if fainted pokemon switches to base form on arena reset",
    async () => {
      const baseForm = 0,
        zenForm = 1;
      game.override.startingWave(4);
      game.override.starterForms({
        [Species.DARMANITAN]: zenForm,
      });

      await game.startBattle([Species.MAGIKARP, Species.DARMANITAN]);

      const darmanitan = game.scene.getParty().find((p) => p.species.speciesId === Species.DARMANITAN);
      expect(darmanitan).not.toBe(undefined);
      expect(darmanitan.formIndex).toBe(zenForm);

      darmanitan.hp = 0;
      darmanitan.status = new Status(StatusEffect.FAINT);
      expect(darmanitan.isFainted()).toBe(true);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.doKillOpponents();
      await game.phaseInterceptor.to(TurnEndPhase);
      game.doSelectModifier();
      await game.phaseInterceptor.to(QuietFormChangePhase);

      expect(darmanitan.formIndex).toBe(baseForm);
    },
    TIMEOUT
  );
});
