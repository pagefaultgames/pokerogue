import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import { TurnEndPhase, } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import Move, { allMoves } from "#app/data/move.js";
import { MoveAbilityBypassAbAttr, WonderSkinAbAttr } from "#app/data/ability.js";
import { NumberHolder } from "#app/utils.js";
import Pokemon from "#app/field/pokemon.js";

describe("Abilities - Wonder Skin", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.WONDER_SKIN);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.CHARM]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("lowers accuracy of status moves to 50%", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    const appliedAccuracy = getAppliedMoveAccuracy(game.scene.getEnemyPokemon(), game.scene.getPlayerPokemon(), allMoves[Moves.CHARM]);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(appliedAccuracy).not.toBe(undefined);
    expect(appliedAccuracy).not.toBe(100);
    expect(appliedAccuracy).toBe(50);
  });

  it("does not lower accuracy of non-status moves", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

    const appliedAccuracy = getAppliedMoveAccuracy(game.scene.getEnemyPokemon(), game.scene.getPlayerPokemon(), allMoves[Moves.TACKLE]);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(appliedAccuracy).not.toBe(undefined);
    expect(appliedAccuracy).toBe(100);
    expect(appliedAccuracy).not.toBe(50);
  });

  it("does not affect pokemon with Mold Breaker", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MOLD_BREAKER);

    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    const appliedAccuracy = getAppliedMoveAccuracy(game.scene.getEnemyPokemon(), game.scene.getPlayerPokemon(), allMoves[Moves.CHARM]);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(appliedAccuracy).not.toBe(undefined);
    expect(appliedAccuracy).toBe(100);
    expect(appliedAccuracy).not.toBe(50);
  });

  it("does not affect pokemon with Teravolt", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.TERAVOLT);

    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    const appliedAccuracy = getAppliedMoveAccuracy(game.scene.getEnemyPokemon(), game.scene.getPlayerPokemon(), allMoves[Moves.CHARM]);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(appliedAccuracy).not.toBe(undefined);
    expect(appliedAccuracy).toBe(100);
    expect(appliedAccuracy).not.toBe(50);
  });

  it("does not affect pokemon with Turboblaze", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.TURBOBLAZE);

    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    const appliedAccuracy = getAppliedMoveAccuracy(game.scene.getEnemyPokemon(), game.scene.getPlayerPokemon(), allMoves[Moves.CHARM]);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(appliedAccuracy).not.toBe(undefined);
    expect(appliedAccuracy).toBe(100);
    expect(appliedAccuracy).not.toBe(50);
  });
});

/**
 * Calculates the adjusted applied accuracy of a move.
 *
 * @param defender - The defending Pokémon.
 * @param attacker - The attacking Pokémon.
 * @param move - The move being used by the attacker.
 * @returns The adjusted accuracy of the move.
 */
const getAppliedMoveAccuracy = (defender: Pokemon, attacker: Pokemon, move: Move) => {
  const accuracyHolder = new NumberHolder(move.accuracy);

  /**
     * Simulate ignoring ability
     * @see MoveAbilityBypassAbAttr
     */
  if (attacker.hasAbilityWithAttr(MoveAbilityBypassAbAttr)) {
    return accuracyHolder.value;
  }

  const wonderSkinInstance = new WonderSkinAbAttr();

  wonderSkinInstance.applyPreDefend(defender, false, attacker, move, { value: false }, [ accuracyHolder ]);

  return accuracyHolder.value;
};
