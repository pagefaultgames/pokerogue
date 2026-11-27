import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

/** HP Cost of Move */
const RATIO = 3;
/** Amount of extra HP lost */
const PREDAMAGE = 15;

describe("Moves - Clangorous Soul", () => {
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
      .moveset([MoveId.CLANGOROUS_SOUL])
      .enemyMoveset(MoveId.SPLASH);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Clangorous_Soul_(move)

  it("raises the user's ATK, DEF, SPATK, SPDEF, and SPD stat stages by 1 each at the cost of 1/3 of its maximum HP", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const leadPokemon = game.field.getPlayerPokemon();
    const hpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);

    game.move.select(MoveId.CLANGOROUS_SOUL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon).toHaveTakenDamage(hpLost);
    expect(leadPokemon).toHaveStatStage(Stat.ATK, 1);
    expect(leadPokemon).toHaveStatStage(Stat.DEF, 1);
    expect(leadPokemon).toHaveStatStage(Stat.SPATK, 1);
    expect(leadPokemon).toHaveStatStage(Stat.SPDEF, 1);
    expect(leadPokemon).toHaveStatStage(Stat.SPD, 1);
  });

  it("will still take effect if one or more of the involved stat stages are not at max", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const leadPokemon = game.field.getPlayerPokemon();
    const hpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);

    //Here - Stat.SPD -> 0 and Stat.SPDEF -> 4
    leadPokemon.setStatStage(Stat.ATK, 6);
    leadPokemon.setStatStage(Stat.DEF, 6);
    leadPokemon.setStatStage(Stat.SPATK, 6);
    leadPokemon.setStatStage(Stat.SPDEF, 4);

    game.move.select(MoveId.CLANGOROUS_SOUL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon).toHaveTakenDamage(hpLost);
    expect(leadPokemon).toHaveStatStage(Stat.ATK, 6);
    expect(leadPokemon).toHaveStatStage(Stat.DEF, 6);
    expect(leadPokemon).toHaveStatStage(Stat.SPATK, 6);
    expect(leadPokemon).toHaveStatStage(Stat.SPDEF, 5);
    expect(leadPokemon).toHaveStatStage(Stat.SPD, 1);
  });

  it("fails if all stat stages involved are at max", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const leadPokemon = game.field.getPlayerPokemon();

    leadPokemon.setStatStage(Stat.ATK, 6);
    leadPokemon.setStatStage(Stat.DEF, 6);
    leadPokemon.setStatStage(Stat.SPATK, 6);
    leadPokemon.setStatStage(Stat.SPDEF, 6);
    leadPokemon.setStatStage(Stat.SPD, 6);

    game.move.select(MoveId.CLANGOROUS_SOUL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon).toHaveFullHp();
    expect(leadPokemon).toHaveStatStage(Stat.ATK, 6);
    expect(leadPokemon).toHaveStatStage(Stat.DEF, 6);
    expect(leadPokemon).toHaveStatStage(Stat.SPATK, 6);
    expect(leadPokemon).toHaveStatStage(Stat.SPDEF, 6);
    expect(leadPokemon).toHaveStatStage(Stat.SPD, 6);
  });

  it("fails if the user's health is less than 1/3", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const leadPokemon = game.field.getPlayerPokemon();
    const hpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);
    leadPokemon.hp = hpLost - PREDAMAGE;

    game.move.select(MoveId.CLANGOROUS_SOUL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon).toHaveHp(hpLost - PREDAMAGE);
    expect(leadPokemon).toHaveStatStage(Stat.ATK, 0);
    expect(leadPokemon).toHaveStatStage(Stat.DEF, 0);
    expect(leadPokemon).toHaveStatStage(Stat.SPATK, 0);
    expect(leadPokemon).toHaveStatStage(Stat.SPDEF, 0);
    expect(leadPokemon).toHaveStatStage(Stat.SPD, 0);
  });
});
