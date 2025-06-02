import { TurnStartPhase } from "#app/phases/turn-start-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    game.override
      .moveset([fusionFlare])
      .startingLevel(1)
      .enemySpecies(Species.RATTATA)
      .enemyMoveset(Moves.REST)
      .battleStyle("single")
      .startingWave(97)
      .disableCrits();
  });

  it("should thaw freeze status condition", async () => {
    await game.classicMode.startBattle([Species.RESHIRAM]);

    const partyMember = game.scene.getPlayerPokemon()!;

    game.move.select(fusionFlare);

    await game.phaseInterceptor.to(TurnStartPhase, false);

    // Inflict freeze quietly and check if it was properly inflicted
    partyMember.trySetStatus(StatusEffect.FREEZE, false);
    expect(partyMember.status!.effect).toBe(StatusEffect.FREEZE);

    await game.toNextTurn();

    // Check if FUSION_FLARE thawed freeze
    expect(partyMember.status?.effect).toBeUndefined();
  });
});
