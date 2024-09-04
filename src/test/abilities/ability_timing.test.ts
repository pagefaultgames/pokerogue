import { BattleStyle } from "#app/enums/battle-style";
import { CommandPhase } from "#app/phases/command-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import i18next, { initI18n } from "#app/plugins/i18n";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


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
      .battleType("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.INTIMIDATE)
      .ability(Abilities.BALL_FETCH);
  });

  it("should trigger after switch check", async () => {
    initI18n();
    i18next.changeLanguage("en");
    game.settings.battleStyle = BattleStyle.SWITCH;
    await game.classicMode.runToSummon([Species.EEVEE, Species.FEEBAS]);

    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase));

    await game.phaseInterceptor.to("MessagePhase");
    const message = game.textInterceptor.getLatestMessage();
    expect(message).toContain("Attack fell");
  }, 5000);
});
