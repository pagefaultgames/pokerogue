import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import { MoveEffectPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import Move, { allMoves } from "#app/data/move.js";
import Pokemon from "#app/field/pokemon.js";
import { FieldMoveTypePowerBoostAbAttr } from "#app/data/ability.js";
import { NumberHolder } from "#app/utils.js";

describe("Abilities - Aura Break", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const multiplier = 9 / 16;

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
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.MOONBLAST, Moves.DARK_PULSE, Moves.MOONBLAST, Moves.DARK_PULSE]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.AURA_BREAK);
  });

  it("reverses the effect of fairy aura", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.FAIRY_AURA);
    const basePower = allMoves[Moves.MOONBLAST].power;
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.MOONBLAST));

    const appliedPower = getMockedMovePower(game.scene.getEnemyField()[0], game.scene.getPlayerField()[0], allMoves[Moves.MOONBLAST]);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(appliedPower).not.toBe(undefined);
    expect(appliedPower).not.toBe(basePower);
    expect(appliedPower).toBe(basePower * multiplier);

  });

  it("reverses the effect of dark aura", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.DARK_AURA);
    const basePower = allMoves[Moves.DARK_PULSE].power;
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DARK_PULSE));

    const appliedPower = getMockedMovePower(game.scene.getEnemyField()[0], game.scene.getPlayerField()[0], allMoves[Moves.DARK_PULSE]);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(appliedPower).not.toBe(undefined);
    expect(appliedPower).not.toBe(basePower);
    expect(appliedPower).toBe(basePower * multiplier);
  });
});

/**
 * Calculates the mocked power of a move in a Pokémon battle, taking into account certain abilities.
 *
 * @param defender - The defending Pokémon.
 * @param attacker - The attacking Pokémon.
 * @param move - The move being used in the attack.
 * @returns The calculated power of the move after applying any relevant ability effects.
 *
 * @remarks
 * This function creates a NumberHolder with the initial power of the move.
 * It then checks if the defender has an ability with the FieldMoveTypePowerBoostAbAttr.
 * If so, it applies a power modification of 9/16 using an instance of FieldMoveTypePowerBoostAbAttr.
 * The final calculated power is then returned.
 */
const getMockedMovePower = (defender: Pokemon, attacker: Pokemon, move: Move): number => {
  const powerHolder = new NumberHolder(move.power);

  if (defender.hasAbilityWithAttr(FieldMoveTypePowerBoostAbAttr)) {
    const auraBreakInstance = new FieldMoveTypePowerBoostAbAttr(move.type, 9 / 16);
    auraBreakInstance.applyPreAttack(attacker, false, defender, move, [powerHolder]);
  }

  return powerHolder.value;
};
