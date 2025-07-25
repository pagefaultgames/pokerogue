import { allMoves } from "#app/data/data-lists";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type Move from "#app/data/moves/move";

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
    game.override.battleStyle("single");
    game.override.ability(AbilityId.BALL_FETCH);
    game.override.enemySpecies(SpeciesId.MUNCHLAX);
    game.override.enemyAbility(AbilityId.BALL_FETCH);
    game.override.enemyMoveset(MoveId.SPLASH);
    game.override.moveset([MoveId.HARD_PRESS]);
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
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.move.select(MoveId.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(50);
  });

  it("should return 1 power if target HP ratio is at 1%", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const targetHpRatio = 0.01;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.move.select(MoveId.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(1);
  });

  it("should return 1 power if target HP ratio is less than 1%", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const targetHpRatio = 0.005;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.move.select(MoveId.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(1);
  });
});
