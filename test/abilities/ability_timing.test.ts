import { BattleStyle } from "#app/enums/battle-style";
import { CommandPhase } from "#app/phases/command-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import i18next from "#app/plugins/i18n";
import { UiMode } from "#enums/ui-mode";
import { AbilityId } from "#enums/ability-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
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
    game.settings.battleStyle = BattleStyle.SWITCH;
    await game.classicMode.runToSummon([SpeciesId.EEVEE, SpeciesId.FEEBAS]);

    game.onNextPrompt(
      "CheckSwitchPhase",
      UiMode.CONFIRM,
      () => {
        game.setMode(UiMode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase),
    );

    await game.phaseInterceptor.to("MessagePhase");
    expect(i18next.t).toHaveBeenCalledWith("battle:statFell", expect.objectContaining({ count: 1 }));
  });
});
