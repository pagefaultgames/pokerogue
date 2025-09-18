import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Move } from "#moves/move";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Hard Press", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let moveToCheck: Move;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    moveToCheck = allMoves[MoveId.HARD_PRESS];
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MUNCHLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.HARD_PRESS]);
    vi.spyOn(moveToCheck, "calculateBattlePower");
  });

  it("should return 100 power if target HP ratio is at 100%", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.select(MoveId.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(100);
  });

  it("should return 50 power if target HP ratio is at 50%", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const targetHpRatio = 0.5;
    const enemy = game.field.getEnemyPokemon();

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.move.select(MoveId.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(50);
  });

  it("should return 1 power if target HP ratio is at 1%", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const targetHpRatio = 0.01;
    const enemy = game.field.getEnemyPokemon();

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.move.select(MoveId.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(1);
  });

  it("should return 1 power if target HP ratio is less than 1%", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const targetHpRatio = 0.005;
    const enemy = game.field.getEnemyPokemon();

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.move.select(MoveId.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(1);
  });
});
