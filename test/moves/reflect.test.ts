import type BattleScene from "#app/battle-scene";
import { ArenaTagSide } from "#app/data/arena-tag";
import type Move from "#app/data/moves/move";
import { allMoves, CritOnlyAttr } from "#app/data/moves/move";
import { Abilities } from "#app/enums/abilities";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import type Pokemon from "#app/field/pokemon";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { NumberHolder } from "#app/utils/common";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let globalScene: BattleScene;

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
    globalScene = game.scene;
    game.override.battleStyle("single");
    game.override.ability(Abilities.NONE);
    game.override.moveset([Moves.ABSORB, Moves.ROCK_SLIDE, Moves.TACKLE]);
    game.override.enemyLevel(100);
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyMoveset([Moves.REFLECT, Moves.REFLECT, Moves.REFLECT, Moves.REFLECT]);
    game.override.disableCrits();
  });

  it("reduces damage of physical attacks by half in a single battle", async () => {
    const moveToUse = Moves.TACKLE;
    await game.classicMode.startBattle([Species.SHUCKLE]);

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);
    const mockedDmg = getMockedMoveDamage(
      game.scene.getEnemyPokemon()!,
      game.scene.getPlayerPokemon()!,
      allMoves[moveToUse],
    );

    expect(mockedDmg).toBe(allMoves[moveToUse].power * singleBattleMultiplier);
  });

  it("reduces damage of physical attacks by a third in a double battle", async () => {
    game.override.battleStyle("double");

    const moveToUse = Moves.ROCK_SLIDE;
    await game.classicMode.startBattle([Species.SHUCKLE, Species.SHUCKLE]);

    game.move.select(moveToUse);
    game.move.select(moveToUse, 1);

    await game.phaseInterceptor.to(TurnEndPhase);
    const mockedDmg = getMockedMoveDamage(
      game.scene.getEnemyPokemon()!,
      game.scene.getPlayerPokemon()!,
      allMoves[moveToUse],
    );

    expect(mockedDmg).toBe(allMoves[moveToUse].power * doubleBattleMultiplier);
  });

  it("does not affect special attacks", async () => {
    const moveToUse = Moves.ABSORB;
    await game.classicMode.startBattle([Species.SHUCKLE]);

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    const mockedDmg = getMockedMoveDamage(
      game.scene.getEnemyPokemon()!,
      game.scene.getPlayerPokemon()!,
      allMoves[moveToUse],
    );

    expect(mockedDmg).toBe(allMoves[moveToUse].power);
  });

  it("does not affect critical hits", async () => {
    game.override.moveset([Moves.WICKED_BLOW]);
    const moveToUse = Moves.WICKED_BLOW;
    await game.classicMode.startBattle([Species.SHUCKLE]);

    game.move.select(moveToUse);
    await game.phaseInterceptor.to(TurnEndPhase);

    const mockedDmg = getMockedMoveDamage(
      game.scene.getEnemyPokemon()!,
      game.scene.getPlayerPokemon()!,
      allMoves[moveToUse],
    );

    expect(mockedDmg).toBe(allMoves[moveToUse].power);
  });

  it("does not affect critical hits", async () => {
    game.override.moveset([Moves.WICKED_BLOW]);
    const moveToUse = Moves.WICKED_BLOW;
    await game.classicMode.startBattle([Species.SHUCKLE]);

    game.move.select(moveToUse);
    await game.phaseInterceptor.to(TurnEndPhase);

    const mockedDmg = getMockedMoveDamage(
      game.scene.getEnemyPokemon()!,
      game.scene.getPlayerPokemon()!,
      allMoves[moveToUse],
    );
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

  if (globalScene.arena.getTagOnSide(ArenaTagType.REFLECT, side)) {
    if (move.getAttrs(CritOnlyAttr).length === 0) {
      globalScene.arena.applyTagsForSide(ArenaTagType.REFLECT, side, false, attacker, move.category, multiplierHolder);
    }
  }

  return move.power * multiplierHolder.value;
};
