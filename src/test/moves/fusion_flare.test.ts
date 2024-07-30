import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { TurnStartPhase } from "#app/phases";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { StatusEffect } from "#app/data/status-effect";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";

describe("Moves - Fusion Flare", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const fusionFlare = Moves.FUSION_FLARE;

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
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ fusionFlare ]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(1);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RESHIRAM);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.REST, Moves.REST, Moves.REST, Moves.REST ]);

    vi.spyOn(overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(97);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("should thaw freeze status condition", async() => {
    await game.startBattle([
      Species.RESHIRAM,
    ]);

    const partyMember = game.scene.getPlayerPokemon();

    game.doAttack(getMovePosition(game.scene, 0, fusionFlare));

    await game.phaseInterceptor.to(TurnStartPhase, false);

    // Inflict freeze quietly and check if it was properly inflicted
    partyMember.trySetStatus(StatusEffect.FREEZE, false);
    expect(partyMember.status.effect).toBe(StatusEffect.FREEZE);

    await game.toNextTurn();

    // Check if FUSION_FLARE thawed freeze
    expect(partyMember.status?.effect).toBeUndefined();
  });
});
