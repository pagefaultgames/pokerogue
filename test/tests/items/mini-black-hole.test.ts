import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { PokemonMoveAccuracyBoosterModifier } from "#modifiers/modifier";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Mini Black Hole", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.NO_GUARD)
      .startingHeldItems([{ name: "WIDE_LENS", count: 10 }])
      .enemyHeldItems([{ name: "MINI_BLACK_HOLE" }])
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should not steal from the opponent when the holder is fainted", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.field.getEnemyPokemon().hp = 1;

    expect(game.scene.getModifiers(PokemonMoveAccuracyBoosterModifier, true)[0].getStackCount()).toBe(10);

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.scene.getModifiers(PokemonMoveAccuracyBoosterModifier, true)[0].getStackCount()).toBe(9);
    expect(game.scene.getModifiers(PokemonMoveAccuracyBoosterModifier, false)[0].getStackCount()).toBe(1);

    game.move.use(MoveId.LEECH_SEED);
    await game.toNextWave();

    expect(game.scene.getModifiers(PokemonMoveAccuracyBoosterModifier, true)[0].getStackCount()).toBe(9);
  });
});
