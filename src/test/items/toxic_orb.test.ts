import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(2000);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([oppMoveToUse, oppMoveToUse, oppMoveToUse, oppMoveToUse]);
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{
      name: "TOXIC_ORB",
    }]);
  });

  it("TOXIC ORB", async() => {
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
