import { Status } from "#app/data/status-effect";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
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
    const moveToUse = Moves.SPLASH;
    game.override.battleStyle("single");
    game.override.ability(Abilities.SCHOOLING);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  test("check if fainted pokemon switches to base form on arena reset", async () => {
    const soloForm = 0,
      schoolForm = 1;
    game.override.startingWave(4);
    game.override.starterForms({
      [Species.WISHIWASHI]: schoolForm,
    });

    await game.startBattle([Species.MAGIKARP, Species.WISHIWASHI]);

    const wishiwashi = game.scene.getPlayerParty().find(p => p.species.speciesId === Species.WISHIWASHI)!;
    expect(wishiwashi).not.toBe(undefined);
    expect(wishiwashi.formIndex).toBe(schoolForm);

    wishiwashi.hp = 0;
    wishiwashi.status = new Status(StatusEffect.FAINT);
    expect(wishiwashi.isFainted()).toBe(true);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(wishiwashi.formIndex).toBe(soloForm);
  });
});
