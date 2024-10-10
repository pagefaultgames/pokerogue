import { BattlerIndex } from "#app/battle";
import { Status, StatusEffect } from "#app/data/status-effect";
import { DamagePhase } from "#app/phases/damage-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import { SwitchType } from "#enums/switch-type";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";


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
    game.override
      .battleType("single")
      .enemySpecies(Species.RATTATA)
      .enemyAbility(Abilities.HYDRATION)
      .ability(Abilities.ZEN_MODE)
      .startingLevel(100)
      .moveset(Moves.SPLASH)
      .enemyMoveset(Moves.TACKLE);
  });

  test(
    "not enough damage to change form",
    async () => {
      await game.classicMode.startBattle([ Species.DARMANITAN ]);

      const player = game.scene.getPlayerPokemon()!;
      player.stats[Stat.HP] = 100;
      player.hp = 100;
      expect(player.formIndex).toBe(0);

      game.move.select(Moves.SPLASH);
      await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
      await game.phaseInterceptor.to(DamagePhase, false);
      const damagePhase = game.scene.getCurrentPhase() as DamagePhase;
      damagePhase.updateAmount(40);
      await game.phaseInterceptor.to("BerryPhase");

      expect(player.hp).toBeLessThan(100);
      expect(player.formIndex).toBe(0);
    },
  );

  test(
    "enough damage to change form",
    async () => {
      await game.classicMode.startBattle([ Species.DARMANITAN ]);

      const player = game.scene.getPlayerPokemon()!;
      player.stats[Stat.HP] = 1000;
      player.hp = 100;
      expect(player.formIndex).toBe(0);

      game.move.select(Moves.SPLASH);
      await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
      await game.phaseInterceptor.to("QuietFormChangePhase");
      await game.phaseInterceptor.to("TurnInitPhase", false);

      expect(player.hp).not.toBe(100);
      expect(player.formIndex).not.toBe(0);
    },
  );

  test(
    "kill pokemon while on zen mode",
    async () => {
      await game.classicMode.startBattle([ Species.DARMANITAN, Species.CHARIZARD ]);
      const player = game.scene.getPlayerPokemon()!;
      player.stats[Stat.HP] = 1000;
      player.hp = 100;
      expect(player.formIndex).toBe(0);

      game.move.select(Moves.SPLASH);

      await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
      await game.phaseInterceptor.to(DamagePhase, false);
      const damagePhase = game.scene.getCurrentPhase() as DamagePhase;
      damagePhase.updateAmount(80);
      await game.phaseInterceptor.to("QuietFormChangePhase");

      expect(player.hp).not.toBe(100);
      expect(player.formIndex).not.toBe(0);

      await game.killPokemon(player);
      expect(player.isFainted()).toBe(true);

      await game.phaseInterceptor.to("TurnStartPhase");
      game.onNextPrompt("SwitchPhase", Mode.PARTY, () => {
        game.scene.unshiftPhase(new SwitchSummonPhase(game.scene, SwitchType.SWITCH, 0, 1, false));
        game.scene.ui.setMode(Mode.MESSAGE);
      });
      game.onNextPrompt("SwitchPhase", Mode.MESSAGE, () => {
        game.endPhase();
      });
      await game.phaseInterceptor.to("PostSummonPhase");

      expect(game.scene.getPlayerParty()[1].formIndex).toBe(1);
    },
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

      await game.classicMode.startBattle([ Species.MAGIKARP, Species.DARMANITAN ]);

      const darmanitan = game.scene.getPlayerParty().find((p) => p.species.speciesId === Species.DARMANITAN)!;
      expect(darmanitan.formIndex).toBe(zenForm);

      darmanitan.hp = 0;
      darmanitan.status = new Status(StatusEffect.FAINT);
      expect(darmanitan.isFainted()).toBe(true);

      game.move.select(Moves.SPLASH);
      await game.doKillOpponents();
      await game.phaseInterceptor.to("TurnEndPhase");
      game.doSelectModifier();
      await game.phaseInterceptor.to("QuietFormChangePhase");

      expect(darmanitan.formIndex).toBe(baseForm);
    },
  );
});
