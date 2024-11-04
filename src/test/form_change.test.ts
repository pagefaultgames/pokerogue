import { FormChangeItem } from "#app/data/pokemon-forms";
import { GameModes, getGameMode } from "#app/game-mode";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { generateStarter } from "#test/utils/gameManagerUtils";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { Type } from "#app/data/type";

describe("Form Change", () => {
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
      .moveset([ Moves.SPLASH ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should not crash", async () => {
    // Test will use Zacian -> Zacian Crowned form change
    game.override.startingHeldItems([{ name: "FORM_CHANGE_ITEM", type: FormChangeItem.RUSTED_SWORD }]);

    await game.runToTitle();

    // Copied from code for `runToSummon()`
    if (game.override.disableShinies) {
      game.override.shiny(false).enemyShiny(false);
    }

    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      game.scene.gameMode = getGameMode(GameModes.CLASSIC);
      const starters = generateStarter(game.scene, [ Species.ZACIAN ]);
      const selectStarterPhase = new SelectStarterPhase(game.scene);
      game.scene.pushPhase(new EncounterPhase(game.scene, false));
      selectStarterPhase.initBattle(starters);
    });

    await game.phaseInterceptor.run("FormChangePhase");

    expect(game.phaseInterceptor.log.includes("FormChangePhase")).toBe(true);

    const zacian = game.scene.getPlayerParty()[0];
    expect(zacian.getFormKey()).toBe("crowned");
    expect(zacian.getTypes()).toStrictEqual([ Type.FAIRY, Type.STEEL ]);
    expect(zacian.calculateBaseStats()).toStrictEqual([ 92, 150, 115, 80, 115, 148 ]);
  });
});
