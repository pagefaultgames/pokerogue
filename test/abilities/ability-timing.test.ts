import { AbilityId } from "#enums/ability-id";
import { SpeciesId } from "#enums/species-id";
import i18next from "#plugins/i18n";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Ability Timing", () => {
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.INTIMIDATE)
      .ability(AbilityId.BALL_FETCH);
    vi.spyOn(i18next, "t");
  });

  it("should trigger after switch check", async () => {
    await game.classicMode.runToSummon([SpeciesId.EEVEE, SpeciesId.FEEBAS]);
    await game.classicMode.startBattleWithSwitch(1);

    expect(i18next.t).toHaveBeenCalledWith("battle:statFell", expect.objectContaining({ count: 1 }));
  });
});
