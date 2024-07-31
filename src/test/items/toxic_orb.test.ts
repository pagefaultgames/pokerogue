import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import {
  CommandPhase,
  EnemyCommandPhase,
  MessagePhase,
  TurnEndPhase,
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {Command} from "#app/ui/command-ui-handler";
import {StatusEffect} from "#app/data/status-effect";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import i18next, { initI18n } from "#app/plugins/i18n";


describe("Items - Toxic orb", () => {
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
    const moveToUse = Moves.GROWTH;
    const oppMoveToUse = Moves.TACKLE;
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(2000);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([oppMoveToUse, oppMoveToUse, oppMoveToUse, oppMoveToUse]);
    vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{
      name: "TOXIC_ORB",
    }]);
  });

  it("TOXIC ORB", async() => {
    initI18n();
    i18next.changeLanguage("en");
    const moveToUse = Moves.GROWTH;
    await game.startBattle([
      Species.MIGHTYENA,
      Species.MIGHTYENA,
    ]);
    expect(game.scene.modifiers[0].type.id).toBe("TOXIC_ORB");

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      // Select Attack
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      // Select Move Growth
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    // will run the 13 phase from enemyCommandPhase to TurnEndPhase
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);
    // Toxic orb should trigger here
    await game.phaseInterceptor.run(MessagePhase);
    const message = game.textInterceptor.getLatestMessage();
    expect(message).toContain("was badly poisoned by Toxic Orb");
    await game.phaseInterceptor.run(MessagePhase);
    const message2 = game.textInterceptor.getLatestMessage();
    expect(message2).toContain("is hurt");
    expect(message2).toContain("by poison");
    expect(game.scene.getParty()[0].status.effect).toBe(StatusEffect.TOXIC);
  }, 20000);
});
