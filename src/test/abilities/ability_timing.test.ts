import { CommandPhase, MessagePhase, TurnInitPhase } from "#app/phases";
import i18next, { initI18n } from "#app/plugins/i18n";
import GameManager from "#test/utils/gameManager";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";


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
    game.override.battleType("single");

    game.override.enemySpecies(Species.PIDGEY);
    game.override.enemyAbility(Abilities.INTIMIDATE);
    game.override.enemyMoveset(SPLASH_ONLY);

    game.override.ability(Abilities.BALL_FETCH);
    game.override.moveset([Moves.SPLASH, Moves.ICE_BEAM]);
  });

  it("should trigger after switch check", async() => {
    initI18n();
    i18next.changeLanguage("en");
    await game.runToSummon([Species.EEVEE, Species.FEEBAS]);

    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase));

    await game.phaseInterceptor.to(MessagePhase);
    const message = game.textInterceptor.getLatestMessage();
    expect(message).toContain("Attack fell");
  }, 5000);
});
