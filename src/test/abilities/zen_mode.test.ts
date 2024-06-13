import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as Overrides from "#app/overrides";
import {
  CommandPhase,
  DamagePhase,
  EnemyCommandPhase,
  MessagePhase,
  PostSummonPhase,
  SwitchPhase,
  SwitchSummonPhase,
  TurnEndPhase,
  TurnInitPhase,
  TurnStartPhase,
} from "#app/phases";
import { Mode } from "#app/ui/ui";
import { Stat } from "#app/data/pokemon-stat";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Command } from "#app/ui/command-ui-handler";
import { QuietFormChangePhase } from "#app/form-change-phase";
import { Status, StatusEffect } from "#app/data/status-effect.js";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";

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
    vi.spyOn(Overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HYDRATION);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.ZEN_MODE);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
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
      vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(4);
      vi.spyOn(Overrides, "STARTER_FORM_OVERRIDES", "get").mockReturnValue({
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
