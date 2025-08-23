import type { BattleScene } from "#app/battle-scene";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import { NumberHolder } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let globalScene: BattleScene;

describe("Moves - Aurora Veil", () => {
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
      .moveset([MoveId.ABSORB, MoveId.ROCK_SLIDE, MoveId.TACKLE])
      .enemyLevel(100)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.AURORA_VEIL)
      .criticalHits(false)
      .weather(WeatherType.HAIL);
  });

  it("reduces damage of physical attacks by half in a single battle", async () => {
    const moveToUse = MoveId.TACKLE;
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    game.move.select(moveToUse);

    await game.toEndOfTurn();
    const mockedDmg = getMockedMoveDamage(
      game.field.getEnemyPokemon(),
      game.field.getPlayerPokemon(),
      allMoves[moveToUse],
    );

    expect(mockedDmg).toBe(allMoves[moveToUse].power * singleBattleMultiplier);
  });

  it("reduces damage of physical attacks by a third in a double battle", async () => {
    game.override.battleStyle("double");

    const moveToUse = MoveId.ROCK_SLIDE;
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.SHUCKLE]);

    game.move.select(moveToUse);
    game.move.select(moveToUse, 1);

    await game.toEndOfTurn();
    const mockedDmg = getMockedMoveDamage(
      game.field.getEnemyPokemon(),
      game.field.getPlayerPokemon(),
      allMoves[moveToUse],
    );

    expect(mockedDmg).toBe(allMoves[moveToUse].power * doubleBattleMultiplier);
  });

  it("reduces damage of special attacks by half in a single battle", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    game.move.use(MoveId.ABSORB);

    await game.toEndOfTurn();

    const mockedDmg = getMockedMoveDamage(
      game.field.getEnemyPokemon(),
      game.field.getPlayerPokemon(),
      allMoves[MoveId.ABSORB],
    );

    expect(mockedDmg).toBe(allMoves[MoveId.ABSORB].power * singleBattleMultiplier);
  });

  it("reduces damage of special attacks by a third in a double battle", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    game.move.use(MoveId.ABSORB);
    await game.toEndOfTurn();
    const mockedDmg = getMockedMoveDamage(
      game.field.getEnemyPokemon(),
      game.field.getPlayerPokemon(),
      allMoves[MoveId.ABSORB],
    );

    expect(mockedDmg).toBe(allMoves[MoveId.ABSORB].power * doubleBattleMultiplier);
  });

  it("does not affect critical hits", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    game.move.use(MoveId.WICKED_BLOW);
    await game.toEndOfTurn();

    const mockedDmg = getMockedMoveDamage(
      game.field.getEnemyPokemon(),
      game.field.getPlayerPokemon(),
      allMoves[MoveId.WICKED_BLOW],
    );
    expect(mockedDmg).toBe(allMoves[MoveId.WICKED_BLOW].power);
  });
});

/**
 * Calculates the damage of a move multiplied by screen's multiplier, Auroa Veil in this case {@linkcode MoveId.AURORA_VEIL}.
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

  if (globalScene.arena.getTagOnSide(ArenaTagType.AURORA_VEIL, side) && move.getAttrs("CritOnlyAttr").length === 0) {
    globalScene.arena.applyTagsForSide(
      ArenaTagType.AURORA_VEIL,
      side,
      false,
      attacker,
      move.category,
      multiplierHolder,
    );
  }

  return move.power * multiplierHolder.value;
};
