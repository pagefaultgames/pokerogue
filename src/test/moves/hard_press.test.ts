import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  MoveEffectPhase
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { allMoves } from "#app/data/move.js";

describe("Moves - Hard Press", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const moveToCheck = allMoves[Moves.HARD_PRESS];

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
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MUNCHLAX);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.HARD_PRESS]);
    vi.spyOn(moveToCheck, "calculateBattlePower");
  });

  it("should return 100 power if target HP ratio is at 100%", async () => {
    await game.startBattle([Species.PIKACHU]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HARD_PRESS));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(100);
  });

  it("should return 50 power if target HP ratio is at 50%", async () => {
    await game.startBattle([Species.PIKACHU]);
    const targetHpRatio = .5;
    const enemy = game.scene.getEnemyPokemon();

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HARD_PRESS));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(50);
  });

  it("should return 1 power if target HP ratio is at 1%", async () => {
    await game.startBattle([Species.PIKACHU]);
    const targetHpRatio = .01;
    const enemy = game.scene.getEnemyPokemon();

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HARD_PRESS));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(1);
  });

  it("should return 1 power if target HP ratio is less than 1%", async () => {
    await game.startBattle([Species.PIKACHU]);
    const targetHpRatio = .005;
    const enemy = game.scene.getEnemyPokemon();

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(targetHpRatio);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HARD_PRESS));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(1);
  });
});
