import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Autotomize", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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
      .moveset([MoveId.AUTOTOMIZE, MoveId.KINGS_SHIELD, MoveId.FALSE_SWIPE])
      .battleStyle("single")
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it(
    "Autotomize should reduce weight",
    async () => {
      const baseDracozoltWeight = 190;
      const oneAutotomizeDracozoltWeight = 90;
      const twoAutotomizeDracozoltWeight = 0.1;
      const threeAutotomizeDracozoltWeight = 0.1;

      await game.classicMode.startBattle([SpeciesId.DRACOZOLT]);
      const playerPokemon = game.field.getPlayerPokemon();
      expect(playerPokemon.getWeight()).toBe(baseDracozoltWeight);
      game.move.select(MoveId.AUTOTOMIZE);
      await game.toNextTurn();
      expect(playerPokemon.getWeight()).toBe(oneAutotomizeDracozoltWeight);

      game.move.select(MoveId.AUTOTOMIZE);
      await game.toNextTurn();
      expect(playerPokemon.getWeight()).toBe(twoAutotomizeDracozoltWeight);

      game.move.select(MoveId.AUTOTOMIZE);
      await game.toNextTurn();
      expect(playerPokemon.getWeight()).toBe(threeAutotomizeDracozoltWeight);
    },
    TIMEOUT,
  );

  it(
    "Changing forms should revert weight",
    async () => {
      const baseAegislashWeight = 53;
      const autotomizeAegislashWeight = 0.1;

      await game.classicMode.startBattle([SpeciesId.AEGISLASH]);
      const playerPokemon = game.field.getPlayerPokemon();

      expect(playerPokemon.getWeight()).toBe(baseAegislashWeight);

      game.move.select(MoveId.AUTOTOMIZE);
      await game.toNextTurn();
      expect(playerPokemon.getWeight()).toBe(autotomizeAegislashWeight);

      // Transform to sword form
      game.move.select(MoveId.FALSE_SWIPE);
      await game.toNextTurn();
      expect(playerPokemon.getWeight()).toBe(baseAegislashWeight);

      game.move.select(MoveId.AUTOTOMIZE);
      await game.toNextTurn();
      expect(playerPokemon.getWeight()).toBe(autotomizeAegislashWeight);

      // Transform to shield form
      game.move.select(MoveId.KINGS_SHIELD);
      await game.toNextTurn();
      expect(playerPokemon.getWeight()).toBe(baseAegislashWeight);

      game.move.select(MoveId.AUTOTOMIZE);
      await game.toNextTurn();
      expect(playerPokemon.getWeight()).toBe(autotomizeAegislashWeight);
    },
    TIMEOUT,
  );

  it(
    "Autotomize should interact with light metal correctly",
    async () => {
      const baseLightGroudonWeight = 475;
      const autotomizeLightGroudonWeight = 425;
      game.override.ability(AbilityId.LIGHT_METAL);
      await game.classicMode.startBattle([SpeciesId.GROUDON]);
      const playerPokemon = game.field.getPlayerPokemon();
      expect(playerPokemon.getWeight()).toBe(baseLightGroudonWeight);
      game.move.select(MoveId.AUTOTOMIZE);
      await game.toNextTurn();
      expect(playerPokemon.getWeight()).toBe(autotomizeLightGroudonWeight);
    },
    TIMEOUT,
  );
});
