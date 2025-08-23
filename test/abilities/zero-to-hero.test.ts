import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { QuietFormChangePhase } from "#phases/quiet-form-change-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - ZERO TO HERO", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const baseForm = 0;
  const heroForm = 1;

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
      .battleStyle("single")
      .moveset(MoveId.SPLASH)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it("should swap to base form on arena reset", async () => {
    game.override.startingWave(4).starterForms({
      [SpeciesId.PALAFIN]: heroForm,
    });

    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.PALAFIN, SpeciesId.PALAFIN]);

    const [, palafin1, palafin2] = game.scene.getPlayerParty();
    expect(palafin1.formIndex).toBe(heroForm);
    expect(palafin2.formIndex).toBe(heroForm);
    palafin2.hp = 0;
    palafin2.status = new Status(StatusEffect.FAINT);
    expect(palafin2.isFainted()).toBe(true);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(QuietFormChangePhase);
    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(palafin1.formIndex).toBe(baseForm);
    expect(palafin2.formIndex).toBe(baseForm);
  });

  it("should swap to Hero form when switching out during a battle", async () => {
    await game.classicMode.startBattle([SpeciesId.PALAFIN, SpeciesId.FEEBAS]);

    const palafin = game.field.getPlayerPokemon();
    expect(palafin.formIndex).toBe(baseForm);

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(QuietFormChangePhase);
    expect(palafin.formIndex).toBe(heroForm);
  });

  it("should not swap to Hero form if switching due to faint", async () => {
    await game.classicMode.startBattle([SpeciesId.PALAFIN, SpeciesId.FEEBAS]);

    const palafin = game.field.getPlayerPokemon();
    expect(palafin.formIndex).toBe(baseForm);

    game.move.select(MoveId.SPLASH);
    await game.killPokemon(palafin);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();
    expect(palafin.formIndex).toBe(baseForm);
  });

  it("should stay hero form if fainted and then revived", async () => {
    game.override.starterForms({
      [SpeciesId.PALAFIN]: heroForm,
    });

    await game.classicMode.startBattle([SpeciesId.PALAFIN, SpeciesId.FEEBAS]);

    const palafin = game.field.getPlayerPokemon();
    expect(palafin.formIndex).toBe(heroForm);

    game.move.select(MoveId.SPLASH);
    await game.killPokemon(palafin);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.doRevivePokemon(1);
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(palafin.formIndex).toBe(heroForm);
  });
});
