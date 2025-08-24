import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Nightmare", () => {
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

    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyStatusEffect(StatusEffect.SLEEP)
      .startingLevel(5)
      .moveset([MoveId.NIGHTMARE, MoveId.SPLASH]);
  });

  it("lowers enemy hp by 1/4 each turn while asleep", async () => {
    await game.classicMode.startBattle([SpeciesId.HYPNO]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const enemyMaxHP = enemyPokemon.hp;

    game.move.select(MoveId.NIGHTMARE);
    await game.toNextTurn();

    expect(enemyPokemon.hp).toBe(enemyMaxHP - Math.floor(enemyMaxHP / 4));

    // take a second turn to make sure damage occurs again
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(enemyPokemon.hp).toBe(enemyMaxHP - Math.floor(enemyMaxHP / 4) - Math.floor(enemyMaxHP / 4));
  });
});
