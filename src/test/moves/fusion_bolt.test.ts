import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#app/data/enums/species";
import { CommandPhase, EnemyCommandPhase, TurnEndPhase } from "#app/phases";
import { Mode } from "#app/ui/ui";
import { Moves } from "#app/data/enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Command } from "#app/ui/command-ui-handler";
import { Abilities } from "#app/data/enums/abilities";

describe("Moves - Fusion Bolt", () => {
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
    const movesToUse = Moves.FUSION_BOLT;
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([movesToUse]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(1);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RESHIRAM);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.ROUGH_SKIN);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);

    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(97);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("FUSION_BOLT does not make contact", async() => {
    const moveToUse = Moves.FUSION_BOLT;
    await game.startBattle([
      Species.ZEKROM,
    ]);
    const hpUser = game.scene.getParty()[0].hp;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);

    const hpLost = hpUser - game.scene.getParty()[0].hp;
    expect(hpLost).toBe(0);
  }, 20000);
});
