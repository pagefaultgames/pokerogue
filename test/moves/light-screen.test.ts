import type { BattleScene } from "#app/battle-scene";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#moves/move";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { NumberHolder } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

let globalScene: BattleScene;

describe("Moves - Light Screen", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const singleBattleMultiplier = 0.5;
  const doubleBattleMultiplier = 2 / 3;

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
    globalScene = game.scene;
    game.override
      .battleStyle("single")
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.ABSORB, MoveId.DAZZLING_GLEAM, MoveId.TACKLE])
      .enemyLevel(100)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.LIGHT_SCREEN)
      .criticalHits(false);
  });

  it("reduces damage of special attacks by half in a single battle", async () => {
    const moveToUse = MoveId.ABSORB;
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    const mockedDmg = getMockedMoveDamage(
      game.field.getEnemyPokemon(),
      game.field.getPlayerPokemon(),
      allMoves[moveToUse],
    );

    expect(mockedDmg).toBe(allMoves[moveToUse].power * singleBattleMultiplier);
  });

  it("reduces damage of special attacks by a third in a double battle", async () => {
    game.override.battleStyle("double");

    const moveToUse = MoveId.DAZZLING_GLEAM;
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.SHUCKLE]);

    game.move.select(moveToUse);
    game.move.select(moveToUse, 1);

    await game.phaseInterceptor.to(TurnEndPhase);
    const mockedDmg = getMockedMoveDamage(
      game.field.getEnemyPokemon(),
      game.field.getPlayerPokemon(),
      allMoves[moveToUse],
    );

    expect(mockedDmg).toBe(allMoves[moveToUse].power * doubleBattleMultiplier);
  });

  it("does not affect physical attacks", async () => {
    const moveToUse = MoveId.TACKLE;
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);
    const mockedDmg = getMockedMoveDamage(
      game.field.getEnemyPokemon(),
      game.field.getPlayerPokemon(),
      allMoves[moveToUse],
    );

    expect(mockedDmg).toBe(allMoves[moveToUse].power);
  });

  it("does not affect critical hits", async () => {
    game.override.moveset([MoveId.FROST_BREATH]);
    const moveToUse = MoveId.FROST_BREATH;
    vi.spyOn(allMoves[MoveId.FROST_BREATH], "accuracy", "get").mockReturnValue(100);
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    game.move.select(moveToUse);
    await game.phaseInterceptor.to(TurnEndPhase);

    const mockedDmg = getMockedMoveDamage(
      game.field.getEnemyPokemon(),
      game.field.getPlayerPokemon(),
      allMoves[moveToUse],
    );
    expect(mockedDmg).toBe(allMoves[moveToUse].power);
  });
});

/**
 * Calculates the damage of a move multiplied by screen's multiplier, Light Screen in this case {@linkcode MoveId.LIGHT_SCREEN}.
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

  if (globalScene.arena.getTagOnSide(ArenaTagType.LIGHT_SCREEN, side) && move.getAttrs("CritOnlyAttr").length === 0) {
    globalScene.arena.applyTagsForSide(
      ArenaTagType.LIGHT_SCREEN,
      side,
      false,
      attacker,
      move.category,
      multiplierHolder,
    );
  }

  return move.power * multiplierHolder.value;
};
