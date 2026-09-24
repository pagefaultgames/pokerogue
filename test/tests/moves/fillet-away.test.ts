import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

/** HP Cost of Move */
const RATIO = 2;
/** Amount of extra HP lost */
const PREDAMAGE = 15;

describe("Moves - FILLET AWAY", () => {
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
      .enemySpecies(SpeciesId.SNORLAX)
      .startingLevel(100)
      .enemyLevel(100)
      .moveset([MoveId.FILLET_AWAY])
      .enemyMoveset(MoveId.SPLASH);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/fillet_away_(move)

  test("raises the user's ATK, SPATK, and SPD stat stages by 2 each, at the cost of 1/2 of its maximum HP", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const leadPokemon = game.field.getPlayerPokemon();
    const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);

    game.move.select(MoveId.FILLET_AWAY);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon).toHaveTakenDamage(hpLost);
    expect(leadPokemon).toHaveStatStage(Stat.ATK, 2);
    expect(leadPokemon).toHaveStatStage(Stat.SPATK, 2);
    expect(leadPokemon).toHaveStatStage(Stat.SPD, 2);
  });

  test("still takes effect if one or more of the involved stat stages are not at max", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const leadPokemon = game.field.getPlayerPokemon();
    const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);

    //Here - Stat.SPD -> 0 and Stat.SPATK -> 3
    leadPokemon.setStatStage(Stat.ATK, 6);
    leadPokemon.setStatStage(Stat.SPATK, 3);

    game.move.select(MoveId.FILLET_AWAY);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon).toHaveTakenDamage(hpLost);
    expect(leadPokemon).toHaveStatStage(Stat.ATK, 6);
    expect(leadPokemon).toHaveStatStage(Stat.SPATK, 5);
    expect(leadPokemon).toHaveStatStage(Stat.SPD, 2);
  });

  test("fails if all stat stages involved are at max", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const leadPokemon = game.field.getPlayerPokemon();

    leadPokemon.setStatStage(Stat.ATK, 6);
    leadPokemon.setStatStage(Stat.SPATK, 6);
    leadPokemon.setStatStage(Stat.SPD, 6);

    game.move.select(MoveId.FILLET_AWAY);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon).toHaveFullHp();
    expect(leadPokemon).toHaveStatStage(Stat.ATK, 6);
    expect(leadPokemon).toHaveStatStage(Stat.SPATK, 6);
    expect(leadPokemon).toHaveStatStage(Stat.SPD, 6);
  });

  test("fails if the user's health is less than 1/2", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const leadPokemon = game.field.getPlayerPokemon();
    const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);
    leadPokemon.hp = hpLost - PREDAMAGE;

    game.move.select(MoveId.FILLET_AWAY);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon).toHaveHp(hpLost - PREDAMAGE);
    expect(leadPokemon).toHaveStatStage(Stat.ATK, 0);
    expect(leadPokemon).toHaveStatStage(Stat.SPATK, 0);
    expect(leadPokemon).toHaveStatStage(Stat.SPD, 0);
  });
});
