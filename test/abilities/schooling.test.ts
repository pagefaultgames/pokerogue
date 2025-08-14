import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { QuietFormChangePhase } from "#phases/quiet-form-change-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Abilities - SCHOOLING", () => {
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
    game.override.battleStyle("single").ability(AbilityId.SCHOOLING).moveset([moveToUse]).enemyMoveset(MoveId.TACKLE);
  });

  test("check if fainted pokemon switches to base form on arena reset", async () => {
    const soloForm = 0;
    const schoolForm = 1;
    game.override.startingWave(4).starterForms({
      [SpeciesId.WISHIWASHI]: schoolForm,
    });

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.WISHIWASHI]);

    const wishiwashi = game.scene.getPlayerParty().find(p => p.species.speciesId === SpeciesId.WISHIWASHI)!;
    expect(wishiwashi).not.toBe(undefined);
    expect(wishiwashi.formIndex).toBe(schoolForm);

    wishiwashi.hp = 0;
    wishiwashi.status = new Status(StatusEffect.FAINT);
    expect(wishiwashi.isFainted()).toBe(true);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(wishiwashi.formIndex).toBe(soloForm);
  });
});
