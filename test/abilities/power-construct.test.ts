import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { QuietFormChangePhase } from "#phases/quiet-form-change-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

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
    const moveToUse = MoveId.SPLASH;
    game.override
      .battleStyle("single")
      .ability(AbilityId.POWER_CONSTRUCT)
      .moveset([moveToUse])
      .enemyMoveset(MoveId.TACKLE);
  });

  test("check if fainted 50% Power Construct Pokemon switches to base form on arena reset", async () => {
    const baseForm = 2;
    const completeForm = 4;
    game.override.startingWave(4).starterForms({
      [SpeciesId.ZYGARDE]: completeForm,
    });

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.ZYGARDE]);

    const zygarde = game.scene.getPlayerParty().find(p => p.species.speciesId === SpeciesId.ZYGARDE);
    expect(zygarde).not.toBe(undefined);
    expect(zygarde!.formIndex).toBe(completeForm);

    zygarde!.hp = 0;
    zygarde!.status = new Status(StatusEffect.FAINT);
    expect(zygarde!.isFainted()).toBe(true);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(zygarde!.formIndex).toBe(baseForm);
  });

  test("check if fainted 10% Power Construct Pokemon switches to base form on arena reset", async () => {
    const baseForm = 3;
    const completeForm = 5;
    game.override.startingWave(4).starterForms({
      [SpeciesId.ZYGARDE]: completeForm,
    });

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.ZYGARDE]);

    const zygarde = game.scene.getPlayerParty().find(p => p.species.speciesId === SpeciesId.ZYGARDE);
    expect(zygarde).not.toBe(undefined);
    expect(zygarde!.formIndex).toBe(completeForm);

    zygarde!.hp = 0;
    zygarde!.status = new Status(StatusEffect.FAINT);
    expect(zygarde!.isFainted()).toBe(true);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(zygarde!.formIndex).toBe(baseForm);
  });
});
