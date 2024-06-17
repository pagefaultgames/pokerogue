import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import { TurnEndPhase, } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import Move, { allMoves, MoveCategory } from "#app/data/move.js";
import { AllyMoveCategoryPowerBoostAbAttr } from "#app/data/ability.js";
import { NumberHolder } from "#app/utils.js";
import Pokemon from "#app/field/pokemon.js";

describe("Abilities - Battery", () => {
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
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.ROCK_SLIDE, Moves.SPLASH, Moves.HEAT_WAVE]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("raises the power of allies' special moves by 30%", async () => {
    const moveToBeUsed = Moves.HEAT_WAVE;
    const basePower = allMoves[moveToBeUsed].power;

    await game.startBattle([Species.MAGIKARP, Species.CHARJABUG]);

    game.doAttack(getMovePosition(game.scene, 0, moveToBeUsed));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    const multiplier = getAttrPowerMultiplier(game.scene.getPlayerField()[1]);
    const appliedPower = getAppliedMovePower(game.scene.getEnemyField()[0], game.scene.getPlayerField()[0], allMoves[moveToBeUsed]);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(appliedPower).not.toBe(undefined);
    expect(appliedPower).not.toBe(basePower);
    expect(appliedPower).toBe(basePower * multiplier);
  });

  it("does not raise the power of allies' non-special moves", async () => {
    const moveToBeUsed = Moves.ROCK_SLIDE;
    const basePower = allMoves[moveToBeUsed].power;

    await game.startBattle([Species.MAGIKARP, Species.CHARJABUG]);

    game.doAttack(getMovePosition(game.scene, 0, moveToBeUsed));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    const multiplier = getAttrPowerMultiplier(game.scene.getPlayerField()[1]);
    const appliedPower = getAppliedMovePower(game.scene.getEnemyField()[0], game.scene.getPlayerField()[0], allMoves[moveToBeUsed]);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(appliedPower).not.toBe(undefined);
    expect(appliedPower).toBe(basePower);
    expect(appliedPower).not.toBe(basePower * multiplier);
  });

  it("does not raise the power of the ability owner's special moves", async () => {
    const moveToBeUsed = Moves.HEAT_WAVE;
    const basePower = allMoves[moveToBeUsed].power;

    await game.startBattle([Species.CHARJABUG, Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, moveToBeUsed));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    const multiplier = getAttrPowerMultiplier(game.scene.getPlayerField()[0]);
    const appliedPower = getAppliedMovePower(game.scene.getEnemyField()[0], game.scene.getPlayerField()[0], allMoves[moveToBeUsed]);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(appliedPower).not.toBe(undefined);
    expect(appliedPower).toBe(basePower);
    expect(appliedPower).not.toBe(basePower * multiplier);
  });
});

/**
 * Calculates the adjusted applied power of a move.
 *
 * @param defender - The defending Pokémon.
 * @param attacker - The attacking Pokémon.
 * @param move - The move being used by the attacker.
 * @returns The adjusted power of the move.
 */
const getAppliedMovePower = (defender: Pokemon, attacker: Pokemon, move: Move) => {
  const powerHolder = new NumberHolder(move.power);

  /**
   * @see AllyMoveCategoryPowerBoostAbAttr
   */
  if (attacker.getAlly().hasAbilityWithAttr(AllyMoveCategoryPowerBoostAbAttr)) {
    const batteryInstance = new AllyMoveCategoryPowerBoostAbAttr([MoveCategory.SPECIAL], 1.3);
    batteryInstance.applyPreAttack(attacker, false, defender, move, [ powerHolder ]);
  }

  return powerHolder.value;
};

/**
 * Retrieves the power multiplier from a Pokémon's ability attribute.
 *
 * @param pokemon - The Pokémon whose ability attributes are being queried.
 * @returns The power multiplier of the `AllyMoveCategoryPowerBoostAbAttr` attribute.
 */
const getAttrPowerMultiplier = (pokemon: Pokemon) => {
  const attr = pokemon.getAbilityAttrs(AllyMoveCategoryPowerBoostAbAttr);

  return (attr[0] as AllyMoveCategoryPowerBoostAbAttr)["powerMultiplier"];
};
