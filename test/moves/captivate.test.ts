import { Gender } from "#data/gender";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Captivate", () => {
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
      .battleStyle("double")
      .enemyGender(Gender.MALE)
      .enemySpecies(SpeciesId.NIDORAN_M)
      .moveset([MoveId.CAPTIVATE, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH)
      .criticalHits(false);
  });

  it("Lowers special attack by two stages when all targets are valid", async () => {
    // arrange
    game.override.playerGender(Gender.FEMALE);
    await game.classicMode.startBattle([SpeciesId.NIDORAN_F, SpeciesId.NIDORAN_F]);
    const [enemyNidoran1, enemyNidoran2] = game.scene.getEnemyField();

    // act
    game.move.select(MoveId.CAPTIVATE, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    // assert
    expect(enemyNidoran1.getStatStage(Stat.SPATK)).toEqual(-2);
    expect(enemyNidoran2.getStatStage(Stat.SPATK)).toEqual(-2);
  });

  it("Lowers special attack of only valid targets", async () => {
    // arrange
    game.override.playerGender(Gender.FEMALE);
    await game.classicMode.startBattle([SpeciesId.NIDORAN_F, SpeciesId.NIDORAN_F]);
    const [invalidTarget, validTarget] = game.scene.getEnemyField();
    invalidTarget.gender = Gender.FEMALE;

    // act
    game.move.select(MoveId.CAPTIVATE, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    // assert
    expect(invalidTarget.getStatStage(Stat.SPATK)).toEqual(0);
    expect(validTarget.getStatStage(Stat.SPATK)).toEqual(-2);
  });

  it("Does not lower special attack when no targets are valid", async () => {
    // arrange
    game.override.playerGender(Gender.MALE);
    await game.classicMode.startBattle([SpeciesId.NIDORAN_M, SpeciesId.NIDORAN_M]);
    const [enemyNidoran1, enemyNidoran2] = game.scene.getEnemyField();

    // act
    game.move.select(MoveId.CAPTIVATE, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    // assert
    expect(enemyNidoran1.getStatStage(Stat.SPATK)).toEqual(0);
    expect(enemyNidoran2.getStatStage(Stat.SPATK)).toEqual(0);
  });

  it("Does not lower special attack when all targets have the Oblivious ability", async () => {
    // arrange
    game.override.enemyAbility(AbilityId.OBLIVIOUS);
    game.override.playerGender(Gender.FEMALE);
    await game.classicMode.startBattle([SpeciesId.NIDORAN_F, SpeciesId.NIDORAN_F]);
    const [enemyNidoran1, enemyNidoran2] = game.scene.getEnemyField();

    // act
    game.move.select(MoveId.CAPTIVATE, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    // assert
    expect(enemyNidoran1.getStatStage(Stat.SPATK)).toEqual(0);
    expect(enemyNidoran2.getStatStage(Stat.SPATK)).toEqual(0);
  });
});
