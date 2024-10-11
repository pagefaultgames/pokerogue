import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import Pokemon, { PlayerPokemon } from "#app/field/pokemon.js";
import Move, { allMoves } from "#app/data/move.js";
import { NumberHolder } from "#app/utils.js";
import { allAbilities, applyPreAttackAbAttrs, UserFieldMoveTypePowerBoostAbAttr } from "#app/data/ability.js";
import { Abilities } from "#app/enums/abilities.js";

describe("Abilities - Steely Spirit", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const steelySpiritMultiplier = 1.5;
  const moveToCheck = Moves.IRON_HEAD;

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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.IRON_HEAD, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("increases Steel-type moves used by the user and its allies", async () => {
    await game.startBattle([Species.MAGIKARP, Species.PERRSERKER]);
    const perserrker = game.scene.getPlayerField()[1];

    vi.spyOn(perserrker, "getAbility").mockReturnValue(allAbilities[Abilities.STEELY_SPIRIT]);

    expect(perserrker.hasAbility(Abilities.STEELY_SPIRIT)).toBe(true);

    game.doAttack(getMovePosition(game.scene, 0, moveToCheck));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    const mockedMovePower = getMockedMovePower(game.scene.getEnemyPokemon(), perserrker, allMoves[moveToCheck]);

    expect(mockedMovePower).toBe(allMoves[moveToCheck].power * steelySpiritMultiplier);
  });

  it("stacks if multiple users with this ability are on the field.", async () => {
    await game.startBattle([Species.PERRSERKER, Species.PERRSERKER]);

    game.scene.getPlayerField().forEach(p => {
      vi.spyOn(p, "getAbility").mockReturnValue(allAbilities[Abilities.STEELY_SPIRIT]);
    });

    expect(game.scene.getPlayerField().every(p => p.hasAbility(Abilities.STEELY_SPIRIT))).toBe(true);

    game.doAttack(getMovePosition(game.scene, 0, moveToCheck));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    const mockedMovePower = getMockedMovePower(game.scene.getEnemyPokemon(), game.scene.getPlayerPokemon(), allMoves[moveToCheck]);

    expect(mockedMovePower).toBe(allMoves[moveToCheck].power * Math.pow(steelySpiritMultiplier, 2));
  });

  it("does not take effect when suppressed", async () => {
    await game.startBattle([Species.MAGIKARP, Species.PERRSERKER]);
    const perserrker = game.scene.getPlayerField()[1];

    vi.spyOn(perserrker, "getAbility").mockReturnValue(allAbilities[Abilities.STEELY_SPIRIT]);
    expect(perserrker.hasAbility(Abilities.STEELY_SPIRIT)).toBe(true);

    perserrker.summonData.abilitySuppressed = true;

    expect(perserrker.hasAbility(Abilities.STEELY_SPIRIT)).toBe(false);
    expect(perserrker.summonData.abilitySuppressed).toBe(true);

    game.doAttack(getMovePosition(game.scene, 0, moveToCheck));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    const mockedMovePower = getMockedMovePower(game.scene.getEnemyPokemon(), perserrker, allMoves[moveToCheck]);

    expect(mockedMovePower).toBe(allMoves[moveToCheck].power);
  });
});

/**
 * Calculates the mocked power of a move.
 * Note this does not consider other damage calculations
 * except the power multiplier from Steely Spirit.
 *
 * @param defender - The defending Pokémon.
 * @param attacker - The attacking Pokémon.
 * @param move - The move being used by the attacker.
 * @returns The adjusted power of the move.
 */
const getMockedMovePower = (defender: Pokemon, attacker: Pokemon, move: Move) => {
  const powerHolder = new NumberHolder(move.power);

  /**
   * Check if pokemon has the specified ability and is in effect.
   * See Pokemon.hasAbility {@linkcode Pokemon.hasAbility}
   */
  if (attacker.hasAbility(Abilities.STEELY_SPIRIT)) {
    const alliedField: Pokemon[] = attacker instanceof PlayerPokemon ? attacker.scene.getPlayerField() : attacker.scene.getEnemyField();
    alliedField.forEach(p => applyPreAttackAbAttrs(UserFieldMoveTypePowerBoostAbAttr, p, this, move, powerHolder));
  }

  return powerHolder.value;
};
