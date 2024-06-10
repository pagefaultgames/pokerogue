import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#app/data/enums/species";
import { CommandPhase, TurnEndPhase, EnemyCommandPhase, TurnStartPhase } from "#app/phases";
import { Mode } from "#app/ui/ui";
import { Moves } from "#app/data/enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Command } from "#app/ui/command-ui-handler";
import { StatusEffect } from "#app/data/status-effect";

describe("Moves - Fusion Flare", () => {
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
    const movesToUse = Moves.FUSION_FLARE;
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([movesToUse]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(1);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RESHIRAM);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.REST, Moves.REST, Moves.REST, Moves.REST]);

    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(97);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("FUSION_FLARE thaws freeze", async() => {
    const moveToUse = Moves.FUSION_FLARE;
    await game.startBattle([
      Species.RESHIRAM,
    ]);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnStartPhase, false);

    // Inflict freeze quietly and check if it was properly inflicted
    game.scene.getParty()[0].trySetStatus(StatusEffect.FREEZE, false);
    expect(game.scene.getParty()[0].status.effect).toBe(StatusEffect.FREEZE);

    await game.phaseInterceptor.runFrom(TurnStartPhase).to(TurnEndPhase);

    // Check if FUSION_FLARE thawed freeze
    expect(game.scene.getParty()[0].status).toBeUndefined();
  });
});
