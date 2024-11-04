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
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Abilities - ZEN MODE", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const baseForm = 0;
  const zenForm = 1;

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

  it("shouldn't change form when taking damage if not dropping below 50% HP", async () => {
    await game.classicMode.startBattle([ Species.DARMANITAN ]);
    const player = game.scene.getPlayerPokemon()!;
    player.stats[Stat.HP] = 100;
    player.hp = 100;
    expect(player.formIndex).toBe(baseForm);

    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.hp).toBeLessThan(100);
    expect(player.formIndex).toBe(baseForm);
  });

  it("should change form when falling below 50% HP", async () => {
    await game.classicMode.startBattle([ Species.DARMANITAN ]);

    const player = game.scene.getPlayerPokemon()!;
    player.stats[Stat.HP] = 1000;
    player.hp = 100;
    expect(player.formIndex).toBe(baseForm);

    game.move.select(Moves.SPLASH);

    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("QuietFormChangePhase");
    await game.phaseInterceptor.to("TurnInitPhase", false);

    expect(player.hp).not.toBe(100);
    expect(player.formIndex).toBe(zenForm);
  });

  it("should stay zen mode when fainted", async () => {
    await game.classicMode.startBattle([ Species.DARMANITAN, Species.CHARIZARD ]);
    const player = game.scene.getPlayerPokemon()!;
    player.stats[Stat.HP] = 1000;
    player.hp = 100;
    expect(player.formIndex).toBe(baseForm);

    game.move.select(Moves.SPLASH);

    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to(DamagePhase, false);
    const damagePhase = game.scene.getCurrentPhase() as DamagePhase;
    damagePhase.updateAmount(80);
    await game.phaseInterceptor.to("QuietFormChangePhase");

    expect(player.hp).not.toBe(100);
    expect(player.formIndex).toBe(zenForm);

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

    expect(game.scene.getPlayerParty()[1].formIndex).toBe(zenForm);
  });

  it("should switch to base form on arena reset", async () => {
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
  });
});
