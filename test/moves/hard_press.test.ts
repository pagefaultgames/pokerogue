import { allMoves } from "#app/data/moves/move";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
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
    moveToCheck = allMoves[Moves.HARD_PRESS];
    game = new GameManager(phaserGame);
    game.override.battleStyle("single");
    game.override.ability(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.MUNCHLAX);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemyMoveset(Moves.SPLASH);
    game.override.moveset([Moves.HARD_PRESS]);
    vi.spyOn(moveToCheck, "calculateBattlePower");
  });

  it("should return 100 power if target HP ratio is at 100%", async () => {
    await game.startBattle([Species.PIKACHU]);

    game.move.select(Moves.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(100);
  });

  it("should return 50 power if target HP ratio is at 50%", async () => {
    await game.startBattle([Species.PIKACHU]);
    const targetHpRatio = 0.5;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.move.select(Moves.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(50);
  });

  it("should return 1 power if target HP ratio is at 1%", async () => {
    await game.startBattle([Species.PIKACHU]);
    const targetHpRatio = 0.01;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.move.select(Moves.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(1);
  });

  it("should return 1 power if target HP ratio is less than 1%", async () => {
    await game.startBattle([Species.PIKACHU]);
    const targetHpRatio = 0.005;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.move.select(Moves.HARD_PRESS);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(1);
  });
});
