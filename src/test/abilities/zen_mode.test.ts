import { Stat } from "#enums/stat";
import { BattlerIndex } from "#app/battle";
import { DamagePhase } from "#app/phases/damage-phase";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { MessagePhase } from "#app/phases/message-phase";
import { PostSummonPhase } from "#app/phases/post-summon-phase";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { SwitchPhase } from "#app/phases/switch-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Status, StatusEffect } from "#app/data/status-effect";

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
      game.scene.getParty()[0].stats[Stat.HP] = 100;
      game.scene.getParty()[0].hp = 100;
      expect(game.scene.getParty()[0].formIndex).toBe(0);

      game.move.select(moveToUse);

      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.phaseInterceptor.to(DamagePhase, false);
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
      game.scene.getParty()[0].stats[Stat.HP] = 1000;
      game.scene.getParty()[0].hp = 100;
      expect(game.scene.getParty()[0].formIndex).toBe(0);

      game.move.select(moveToUse);

      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.phaseInterceptor.to(QuietFormChangePhase);
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
      game.scene.getParty()[0].stats[Stat.HP] = 1000;
      game.scene.getParty()[0].hp = 100;
      expect(game.scene.getParty()[0].formIndex).toBe(0);

      game.move.select(moveToUse);

      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.phaseInterceptor.to(DamagePhase, false);
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

      const darmanitan = game.scene.getParty().find((p) => p.species.speciesId === Species.DARMANITAN)!;
      expect(darmanitan).not.toBe(undefined);
      expect(darmanitan.formIndex).toBe(zenForm);

      darmanitan.hp = 0;
      darmanitan.status = new Status(StatusEffect.FAINT);
      expect(darmanitan.isFainted()).toBe(true);

      game.move.select(Moves.SPLASH);
      await game.doKillOpponents();
      await game.phaseInterceptor.to(TurnEndPhase);
      game.doSelectModifier();
      await game.phaseInterceptor.to(QuietFormChangePhase);

      expect(darmanitan.formIndex).toBe(baseForm);
    },
    TIMEOUT
  );
});
