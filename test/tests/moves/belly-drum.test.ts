import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Belly Drum", () => {
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
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  // Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Belly_Drum_(move)

  it("should maximize the user's ATK stat stage at the cost of 1/2 of its maximum HP", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.use(MoveId.BELLY_DRUM);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveTakenDamage(player.getMaxHp() / 2);
    expect(player).toHaveStatStage(Stat.ATK, 6);
  });

  it("should ignore other stat stages and always set the user to +6", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    player.setStatStage(Stat.ATK, -6);
    player.setStatStage(Stat.SPATK, 6);

    game.move.use(MoveId.BELLY_DRUM);
    await game.toEndOfTurn();

    expect(player).toHaveTakenDamage(player.getMaxHp() / 2);
    expect(player).toHaveStatStage(Stat.ATK, 6);
    expect(player).toHaveStatStage(Stat.SPATK, 6);
  });

  it("should fail if the pokemon's ATK stat stage is already maximized", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    player.setStatStage(Stat.ATK, 6);

    game.move.use(MoveId.BELLY_DRUM);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.BELLY_DRUM, result: MoveResult.FAIL });
    expect(player).toHaveFullHp();
    expect(player).toHaveStatStage(Stat.ATK, 6);
  });

  it("should fail if the user lacks sufficient HP", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    player.hp = toDmgValue(player.getMaxHp() / 2) - 1;

    game.move.use(MoveId.BELLY_DRUM);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.BELLY_DRUM, result: MoveResult.FAIL });
    expect(player).toHaveStatStage(Stat.ATK, 0);
    expect(player).toHaveHp(toDmgValue(player.getMaxHp() / 2) - 1);
  });

  // test for contrary interaction in contrary test file
});
