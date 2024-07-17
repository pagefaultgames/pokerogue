import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import {
  TurnEndPhase,
} from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Abilities } from "#app/enums/abilities.js";
import Pokemon from "#app/field/pokemon.js";
import Move, { allMoves } from "#app/data/move.js";
import { NumberHolder } from "#app/utils.js";
import { ArenaTagSide } from "#app/data/arena-tag.js";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";


describe("Moves - Reflect", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const singleBattleMultiplier = 0.5;
  const doubleBattleMultiplier = 2732/4096;

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
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.ABSORB, Moves.ROCK_SLIDE, Moves.TACKLE]);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.REFLECT, Moves.REFLECT, Moves.REFLECT, Moves.REFLECT]);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("reduces damage of physical attacks by half in a single battle", async() => {
    const moveToUse = Moves.TACKLE;
    await game.startBattle([Species.SHUCKLE]);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);
    const mockedDmg = getMockedMoveDamage(game.scene.getEnemyPokemon(), game.scene.getPlayerPokemon(), allMoves[moveToUse]);

    expect(mockedDmg).toBe(allMoves[moveToUse].power * singleBattleMultiplier);
  });

  it("reduces damage of physical attacks by a third in a double battle", async() => {
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);

    const moveToUse = Moves.ROCK_SLIDE;
    await game.startBattle([Species.SHUCKLE, Species.SHUCKLE]);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));
    game.doAttack(getMovePosition(game.scene, 1, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);
    const mockedDmg = getMockedMoveDamage(game.scene.getEnemyPokemon(), game.scene.getPlayerPokemon(), allMoves[moveToUse]);

    expect(mockedDmg).toBe(allMoves[moveToUse].power * doubleBattleMultiplier);
  });

  it("does not affect special attacks", async() => {
    const moveToUse = Moves.ABSORB;
    await game.startBattle([Species.SHUCKLE]);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    const mockedDmg = getMockedMoveDamage(game.scene.getEnemyPokemon(), game.scene.getPlayerPokemon(), allMoves[moveToUse]);

    expect(mockedDmg).toBe(allMoves[moveToUse].power);
  });
});

/**
 * Calculates the damage of a move multiplied by screen's multiplier, Reflect in this case {@linkcode Moves.REFLECT}.
 * Please note this does not consider other damage calculations except the screen multiplier.
 *
 * @param defender - The defending Pokémon.
 * @param attacker - The attacking Pokémon.
 * @param move - The move being used.
 * @returns The calculated move damage considering any weakening effects.
 */
const getMockedMoveDamage = (defender: Pokemon, attacker: Pokemon, move: Move) => {
  const multiplierHolder = new NumberHolder(1);
  const side = defender.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;

  if (defender.scene.arena.getTagOnSide(ArenaTagType.REFLECT, side)) {
    defender.scene.arena.applyTagsForSide(ArenaTagType.REFLECT, side, move.category, defender.scene.currentBattle.double, multiplierHolder);
  }

  return move.power * multiplierHolder.value;
};
