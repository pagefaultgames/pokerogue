import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/testUtils/gameManager";
import { Stat } from "#enums/stat";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.INTIMIDATE)
      .ability(AbilityId.INTIMIDATE)
      .moveset(MoveId.SPLASH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should lower all non-immune opponents ATK stat stage by 1 of enemy Pokemon on entry and player switch", async () => {
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    const player = game.field.getPlayerPokemon()
    const enemy = game.field.getEnemyPokemon()

    expect(player.species.speciesId).toBe(SpeciesId.MIGHTYENA);
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);
    expect(player.getStatStage(Stat.ATK)).toBe(-1);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon()).toBe(player);
    expect(player.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should lower ATK stat stage by 1 for every enemy Pokemon in a double battle on entry", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    const playerField = game.scene.getPlayerField();
    const enemyField = game.scene.getEnemyField();

    expect(enemyField[0].getStatStage(Stat.ATK)).toBe(-2);
    expect(enemyField[1].getStatStage(Stat.ATK)).toBe(-2);
    expect(playerField[0].getStatStage(Stat.ATK)).toBe(-2);
    expect(playerField[1].getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should not activate again if there is no switch or new entry", async () => {
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    const player = game.field.getPlayerPokemon()
    const enemy = game.field.getEnemyPokemon()

    expect(player.getStatStage(Stat.ATK)).toBe(-1);
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.getStatStage(Stat.ATK)).toBe(-1);
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not trigger on switching moves used by wild Pokemon", async () => {
    game.override.enemyMoveset(MoveId.VOLT_SWITCH).battleType(BattleType.WILD);
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA]);

    const playerPokemon = game.field.getPlayerPokemon()
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    // doesn't lower attack due to not actually switching out
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should trigger on moves that switch user/target out during trainer battles", async () => {
    game.override.battleType(BattleType.TRAINER).passiveAbility(AbilityId.NO_GUARD);

    await game.classicMode.startBattle([SpeciesId.MIGHTYENA]);

    const player = game.field.getPlayerPokemon();
    expect(player.getStatStage(Stat.ATK)).toBe(-1);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TELEPORT);
    await game.toNextTurn();

    expect(player.getStatStage(Stat.ATK)).toBe(-2);

    game.move.use(MoveId.DRAGON_TAIL);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.getStatStage(Stat.ATK)).toBe(-3);
  });
});
