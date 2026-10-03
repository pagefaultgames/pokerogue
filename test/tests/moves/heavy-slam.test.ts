import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Heavy Slam", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.CORVIKNIGHT)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should do 40 base damage if same weight", async () => {
    await game.classicMode.startBattle(SpeciesId.CORVIKNIGHT);

    const heavySlam = allMoves[MoveId.HEAVY_SLAM];
    vi.spyOn(heavySlam, "calculateBattlePower");

    game.move.use(MoveId.HEAVY_SLAM);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(heavySlam.calculateBattlePower).toHaveLastReturnedWith(40);
  });

  it("should do 120 base damage if gigantamax", async () => {
    game.override.starterForms({ [SpeciesId.CORVIKNIGHT]: 1 });

    await game.classicMode.startBattle(SpeciesId.CORVIKNIGHT);

    const heavySlam = allMoves[MoveId.HEAVY_SLAM];
    vi.spyOn(heavySlam, "calculateBattlePower");

    game.move.use(MoveId.HEAVY_SLAM);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(heavySlam.calculateBattlePower).toHaveLastReturnedWith(120);
  });
});
