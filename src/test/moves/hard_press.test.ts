import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  MoveEffectPhase,
  TurnStartPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import Move from "#app/data/move.js";
import { allMoves, OpponentHighHpPowerAttr } from "#app/data/move.js";

describe("Moves - Hard Press", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  /**
   * Retrieves the maximum base power of a move based on its attributes.
   *
   * @param move - The move which maximum base power is being retrieved.
   * @returns The maximum base power of the move.
   */
  const getMoveMaxBasePower = (move: Move): number => {
    const attr = move.getAttrs(OpponentHighHpPowerAttr);

    return (attr[0] as OpponentHighHpPowerAttr)["maxBasePower"];
  };

  /**
   * Computes Hard Press's power based on formula from Bulbapedia.
   * {@link https://bulbapedia.bulbagarden.net/wiki/Hard_Press_(move)}
   *
   * @param targetHpRatio - Target's HP ratio.
   * @returns The computed power of the move.
   */
  const computeHardPressMovePower = (targetHpRatio: number): number => {
    getMoveMaxBasePower(moveToCheck);
    return Math.max(Math.floor(moveMaxBasePower * targetHpRatio), 1);
  };

  const moveToCheck = allMoves[Moves.HARD_PRESS];
  const moveMaxBasePower = getMoveMaxBasePower(moveToCheck);


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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MUNCHLAX);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.HARD_PRESS]);
  });

  it("power varies between 1 and 100 based on target health ratio (random)", async () => {
    await game.startBattle([Species.PIKACHU]);
    const enemy = game.scene.getEnemyPokemon();
    const ally = game.scene.getPlayerPokemon();

    const fullHpMovePower = moveToCheck.calculateBattlePower(ally, enemy);
    expect(fullHpMovePower).toBe(moveMaxBasePower);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HARD_PRESS));
    await game.phaseInterceptor.to(MoveEffectPhase);

    const reducedHpMovePower = moveToCheck.calculateBattlePower(ally, enemy);
    expect(reducedHpMovePower).toBe(computeHardPressMovePower(enemy.getHpRatio()));
  });

  it("power varies between 1 and 100 based on target health ratio (100%)", async () => {
    await game.startBattle([Species.PIKACHU]);
    const enemy = game.scene.getEnemyPokemon();
    const ally = game.scene.getPlayerPokemon();

    const fullHpMovePower = moveToCheck.calculateBattlePower(ally, enemy);
    expect(fullHpMovePower).toBe(moveMaxBasePower);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HARD_PRESS));
    await game.phaseInterceptor.to(TurnStartPhase);
  });

  it("power varies between 1 and 100 based on target health ratio (50%)", async () => {
    await game.startBattle([Species.PIKACHU]);
    const enemy = game.scene.getEnemyPokemon();
    const ally = game.scene.getPlayerPokemon();

    const fullHpMovePower = moveToCheck.calculateBattlePower(ally, enemy);
    expect(fullHpMovePower).toBe(moveMaxBasePower);

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(.5);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HARD_PRESS));
    await game.phaseInterceptor.to(TurnStartPhase);

    const halfHpMovePower = moveToCheck.calculateBattlePower(ally, enemy);
    expect(halfHpMovePower).toBe(computeHardPressMovePower(enemy.getHpRatio()) );
  });

  it("power varies between 1 and 100 based on target health ratio (1%)", async () => {
    await game.startBattle([Species.PIKACHU]);
    const enemy = game.scene.getEnemyPokemon();
    const ally = game.scene.getPlayerPokemon();

    const fullHpMovePower = moveToCheck.calculateBattlePower(ally, enemy);
    expect(fullHpMovePower).toBe(moveMaxBasePower);

    vi.spyOn(enemy, "getMaxHp").mockReturnValue(100);
    vi.spyOn(enemy, "getHpRatio").mockReturnValue(.01);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HARD_PRESS));
    await game.phaseInterceptor.to(TurnStartPhase);

    const oneHpMovePower = moveToCheck.calculateBattlePower(ally, enemy);
    expect(oneHpMovePower).toBe(computeHardPressMovePower(enemy.getHpRatio()));
  });

  it("power varies between 1 and 100 based on target health ratio (less than 1%)", async () => {
    await game.startBattle([Species.PIKACHU]);
    const enemy = game.scene.getEnemyPokemon();
    const ally = game.scene.getPlayerPokemon();

    const fullHpMovePower = moveToCheck.calculateBattlePower(ally, enemy);
    expect(fullHpMovePower).toBe(moveMaxBasePower);

    vi.spyOn(enemy, "getHpRatio").mockReturnValue(.005);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HARD_PRESS));
    await game.phaseInterceptor.to(TurnStartPhase);

    const lessThanOnePercentHpMovePower = moveToCheck.calculateBattlePower(ally, enemy);
    expect(lessThanOnePercentHpMovePower).toBe(computeHardPressMovePower(enemy.getHpRatio()));
  });
});
