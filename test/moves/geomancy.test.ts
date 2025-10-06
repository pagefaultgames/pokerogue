import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import type { EffectiveStat } from "#enums/stat";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Geomancy", () => {
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
      .moveset(MoveId.GEOMANCY)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should boost the user's stats on the second turn of use", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const player = game.field.getPlayerPokemon();
    const affectedStats: EffectiveStat[] = [Stat.SPATK, Stat.SPDEF, Stat.SPD];

    game.move.select(MoveId.GEOMANCY);

    await game.phaseInterceptor.to("TurnEndPhase");
    affectedStats.forEach(stat => expect(player.getStatStage(stat)).toBe(0));
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.OTHER);

    await game.phaseInterceptor.to("TurnEndPhase");
    affectedStats.forEach(stat => expect(player.getStatStage(stat)).toBe(2));
    expect(player.getMoveHistory()).toHaveLength(2);
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);

    const playerGeomancy = player.getMoveset().find(mv => mv && mv.moveId === MoveId.GEOMANCY);
    expect(playerGeomancy?.ppUsed).toBe(1);
  });

  it("should execute over 2 turns between waves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const player = game.field.getPlayerPokemon();
    const affectedStats: EffectiveStat[] = [Stat.SPATK, Stat.SPDEF, Stat.SPD];

    game.move.select(MoveId.GEOMANCY);

    await game.phaseInterceptor.to("MoveEndPhase", false);
    await game.doKillOpponents();

    await game.toNextWave();

    await game.phaseInterceptor.to("TurnEndPhase");
    affectedStats.forEach(stat => expect(player.getStatStage(stat)).toBe(2));
    expect(player.getMoveHistory()).toHaveLength(2);
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);

    const playerGeomancy = player.getMoveset().find(mv => mv && mv.moveId === MoveId.GEOMANCY);
    expect(playerGeomancy?.ppUsed).toBe(1);
  });
});
