import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Power Shift", () => {
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
      .moveset([MoveId.POWER_SHIFT, MoveId.BULK_UP])
      .battleStyle("single")
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("switches the user's raw Attack stat with its raw Defense stat", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();

    playerPokemon.setStat(Stat.ATK, 10, false);
    playerPokemon.setStat(Stat.DEF, 20, false);

    game.move.select(MoveId.BULK_UP);

    await game.phaseInterceptor.to("TurnEndPhase");

    // Stat stages are increased by 1
    expect(playerPokemon.getStatStageMultiplier(Stat.ATK)).toBe(1.5);
    expect(playerPokemon.getStatStageMultiplier(Stat.DEF)).toBe(1.5);

    await game.toNextTurn();

    game.move.select(MoveId.POWER_SHIFT);

    await game.phaseInterceptor.to("TurnEndPhase");

    // Effective stats are calculated correctly
    expect(playerPokemon.getEffectiveStat(Stat.ATK)).toBe(30);
    expect(playerPokemon.getEffectiveStat(Stat.DEF)).toBe(15);
    // Raw stats are swapped
    expect(playerPokemon.getStat(Stat.ATK, false)).toBe(20);
    expect(playerPokemon.getStat(Stat.DEF, false)).toBe(10);
  });
});
