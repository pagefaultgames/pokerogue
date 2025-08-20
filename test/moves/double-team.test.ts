import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Double Team", () => {
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
      .battleStyle("single")
      .moveset([MoveId.DOUBLE_TEAM])
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE);
  });

  it("raises the user's EVA stat stage by 1", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const ally = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    vi.spyOn(enemy, "getAccuracyMultiplier");
    expect(ally.getStatStage(Stat.EVA)).toBe(0);

    game.move.select(MoveId.DOUBLE_TEAM);
    await game.phaseInterceptor.to(TurnEndPhase);
    await game.toNextTurn();

    expect(ally.getStatStage(Stat.EVA)).toBe(1);
    expect(enemy.getAccuracyMultiplier).toHaveReturnedWith(0.75);
  });
});
