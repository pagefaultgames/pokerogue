import { ArenaTagSide } from "#app/data/arena-tag";
import Move, { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import Pokemon from "#app/field/pokemon";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { NumberHolder } from "#app/utils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Moves - Reflect", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const singleBattleMultiplier = 0.5;
  const doubleBattleMultiplier = 2732 / 4096;

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
    game.override.battleType("single");
    game.override.ability(Abilities.NONE);
    game.override.moveset([Moves.ABSORB, Moves.ROCK_SLIDE, Moves.TACKLE]);
    game.override.enemyLevel(100);
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyMoveset([Moves.REFLECT, Moves.REFLECT, Moves.REFLECT, Moves.REFLECT]);
    game.override.disableCrits();
  });

  it("reduces damage of physical attacks by half in a single battle", async () => {
    const moveToUse = Moves.TACKLE;
    await game.startBattle([Species.SHUCKLE]);

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);
    const mockedDmg = getMockedMoveDamage(game.scene.getEnemyPokemon()!, game.scene.getPlayerPokemon()!, allMoves[moveToUse]);

    expect(mockedDmg).toBe(allMoves[moveToUse].power * singleBattleMultiplier);
  });

  it("reduces damage of physical attacks by a third in a double battle", async () => {
    game.override.battleType("double");

    const moveToUse = Moves.ROCK_SLIDE;
    await game.startBattle([Species.SHUCKLE, Species.SHUCKLE]);

    game.move.select(moveToUse);
    game.move.select(moveToUse, 1);

    await game.phaseInterceptor.to(TurnEndPhase);
    const mockedDmg = getMockedMoveDamage(game.scene.getEnemyPokemon()!, game.scene.getPlayerPokemon()!, allMoves[moveToUse]);

    expect(mockedDmg).toBe(allMoves[moveToUse].power * doubleBattleMultiplier);
  });

  it("does not affect special attacks", async () => {
    const moveToUse = Moves.ABSORB;
    await game.startBattle([Species.SHUCKLE]);

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    const mockedDmg = getMockedMoveDamage(game.scene.getEnemyPokemon()!, game.scene.getPlayerPokemon()!, allMoves[moveToUse]);

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
