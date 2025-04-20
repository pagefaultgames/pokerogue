import { Status } from "#app/data/status-effect";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
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
    const moveToUse = Moves.SPLASH;
    game.override.battleStyle("single");
    game.override.ability(Abilities.POWER_CONSTRUCT);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  test("check if fainted 50% Power Construct Pokemon switches to base form on arena reset", async () => {
    const baseForm = 2,
      completeForm = 4;
    game.override.startingWave(4);
    game.override.starterForms({
      [Species.ZYGARDE]: completeForm,
    });

    await game.classicMode.startBattle([Species.MAGIKARP, Species.ZYGARDE]);

    const zygarde = game.scene.getPlayerParty().find(p => p.species.speciesId === Species.ZYGARDE);
    expect(zygarde).not.toBe(undefined);
    expect(zygarde!.formIndex).toBe(completeForm);

    zygarde!.hp = 0;
    zygarde!.status = new Status(StatusEffect.FAINT);
    expect(zygarde!.isFainted()).toBe(true);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(zygarde!.formIndex).toBe(baseForm);
  });

  test("check if fainted 10% Power Construct Pokemon switches to base form on arena reset", async () => {
    const baseForm = 3,
      completeForm = 5;
    game.override.startingWave(4);
    game.override.starterForms({
      [Species.ZYGARDE]: completeForm,
    });

    await game.classicMode.startBattle([Species.MAGIKARP, Species.ZYGARDE]);

    const zygarde = game.scene.getPlayerParty().find(p => p.species.speciesId === Species.ZYGARDE);
    expect(zygarde).not.toBe(undefined);
    expect(zygarde!.formIndex).toBe(completeForm);

    zygarde!.hp = 0;
    zygarde!.status = new Status(StatusEffect.FAINT);
    expect(zygarde!.isFainted()).toBe(true);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(zygarde!.formIndex).toBe(baseForm);
  });
});
