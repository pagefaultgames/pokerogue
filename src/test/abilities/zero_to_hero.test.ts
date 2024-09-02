import { Status, StatusEffect } from "#app/data/status-effect";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

const TIMEOUT = 20 * 1000;

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
      .battleType("single")
      .moveset(SPLASH_ONLY)
      .enemyMoveset(SPLASH_ONLY)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("should swap to base form on arena reset", async () => {
    game.override.startingWave(4);
    game.override.starterForms({
      [Species.PALAFIN]: heroForm,
    });

    await game.startBattle([Species.FEEBAS, Species.PALAFIN, Species.PALAFIN]);

    const palafin1 = game.scene.getParty()[1];
    const palafin2 = game.scene.getParty()[2];
    expect(palafin1.formIndex).toBe(heroForm);
    expect(palafin2.formIndex).toBe(heroForm);
    palafin2.hp = 0;
    palafin2.status = new Status(StatusEffect.FAINT);
    expect(palafin2.isFainted()).toBe(true);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(QuietFormChangePhase);
    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(palafin1.formIndex).toBe(baseForm);
    expect(palafin2.formIndex).toBe(baseForm);
  }, TIMEOUT);

  it("should swap to Hero form when switching out during a battle", async () => {
    await game.startBattle([Species.PALAFIN, Species.FEEBAS]);

    const palafin = game.scene.getPlayerPokemon()!;
    expect(palafin.formIndex).toBe(baseForm);

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(QuietFormChangePhase);
    expect(palafin.formIndex).toBe(heroForm);
  }, TIMEOUT);

  it("should not swap to Hero form if switching due to faint", async () => {
    await game.startBattle([Species.PALAFIN, Species.FEEBAS]);

    const palafin = game.scene.getPlayerPokemon()!;
    expect(palafin.formIndex).toBe(baseForm);

    game.move.select(Moves.SPLASH);
    await game.killPokemon(palafin);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();
    expect(palafin.formIndex).toBe(baseForm);
  }, TIMEOUT);

  it("should stay hero form if fainted and then revived", async () => {
    game.override.starterForms({
      [Species.PALAFIN]: heroForm,
    });

    await game.startBattle([Species.PALAFIN, Species.FEEBAS]);

    const palafin = game.scene.getPlayerPokemon()!;
    expect(palafin.formIndex).toBe(heroForm);

    game.move.select(Moves.SPLASH);
    await game.killPokemon(palafin);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.doRevivePokemon(1);
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(palafin.formIndex).toBe(heroForm);
  }, TIMEOUT);
});
