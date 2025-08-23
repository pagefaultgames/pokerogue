import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

// RATIO : HP Cost of Move
const RATIO = 2;
// PREDAMAGE : Amount of extra HP lost
const PREDAMAGE = 15;

describe("Moves - BELLY DRUM", () => {
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
      .starterSpecies(SpeciesId.MAGIKARP)
      .enemySpecies(SpeciesId.SNORLAX)
      .startingLevel(100)
      .enemyLevel(100)
      .moveset([MoveId.BELLY_DRUM])
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  // Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Belly_Drum_(move)

  test("raises the user's ATK stat stage to its max, at the cost of 1/2 of its maximum HP", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();
    const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);

    game.move.select(MoveId.BELLY_DRUM);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp() - hpLost);
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(6);
  });

  test("will still take effect if an uninvolved stat stage is at max", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();
    const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);

    // Here - Stat.ATK -> -3 and Stat.SPATK -> 6
    leadPokemon.setStatStage(Stat.ATK, -3);
    leadPokemon.setStatStage(Stat.SPATK, 6);

    game.move.select(MoveId.BELLY_DRUM);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp() - hpLost);
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(6);
    expect(leadPokemon.getStatStage(Stat.SPATK)).toBe(6);
  });

  test("fails if the pokemon's ATK stat stage is at its maximum", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    leadPokemon.setStatStage(Stat.ATK, 6);

    game.move.select(MoveId.BELLY_DRUM);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(6);
  });

  test("fails if the user's health is less than 1/2", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();
    const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);
    leadPokemon.hp = hpLost - PREDAMAGE;

    game.move.select(MoveId.BELLY_DRUM);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.hp).toBe(hpLost - PREDAMAGE);
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });
});
