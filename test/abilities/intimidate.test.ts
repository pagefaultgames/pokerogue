import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/testUtils/gameManager";
import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattleType } from "#enums/battle-type";

describe("Abilities - Intimidate", () => {
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
      .enemySpecies(Species.RATTATA)
      .enemyAbility(Abilities.INTIMIDATE)
      .ability(Abilities.INTIMIDATE)
      .moveset(Moves.SPLASH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should lower ATK stat stage by 1 of enemy Pokemon on entry and player switch", async () => {
    await game.classicMode.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    let playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(playerPokemon.species.speciesId).toBe(Species.MIGHTYENA);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.species.speciesId).toBe(Species.POOCHYENA);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should lower ATK stat stage by 1 for every enemy Pokemon in a double battle on entry", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    const playerField = game.scene.getPlayerField()!;
    const enemyField = game.scene.getEnemyField()!;

    expect(enemyField[0].getStatStage(Stat.ATK)).toBe(-2);
    expect(enemyField[1].getStatStage(Stat.ATK)).toBe(-2);
    expect(playerField[0].getStatStage(Stat.ATK)).toBe(-2);
    expect(playerField[1].getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should not activate again if there is no switch or new entry", async () => {
    await game.classicMode.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should NOT trigger on switching moves used by wild Pokemon", async () => {
    game.override.enemyMoveset(Moves.VOLT_SWITCH).battleType(BattleType.WILD);
    await game.classicMode.startBattle([Species.MIGHTYENA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();
    // doesn't lower attack due to not actually switching out
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should trigger on moves that switch user/target out during trainer battles", async () => {
    game.override.battleType(BattleType.TRAINER).passiveAbility(Abilities.NO_GUARD);

    await game.classicMode.startBattle([Species.MIGHTYENA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.move.use(Moves.SPLASH);
    await game.move.forceEnemyMove(Moves.TELEPORT);
    await game.toNextTurn();
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-2);

    game.move.use(Moves.DRAGON_TAIL);
    await game.move.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-3);
  });
});
