import { Gender } from "#data/gender";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Captivate", () => {
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
      .battleStyle("double")
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.CAPTIVATE, MoveId.SPLASH])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should only lower Sp. Atk of opposite-gender targets, not same-gender ones", async () => {
    await game.classicMode.startBattle(SpeciesId.NIDORAN_M, SpeciesId.NIDORAN_M);

    const [oppositeGenderEnemy, sameGenderEnemy] = game.scene.getEnemyParty();
    oppositeGenderEnemy.gender = Gender.FEMALE;
    sameGenderEnemy.gender = Gender.MALE;

    game.move.select(MoveId.CAPTIVATE, 0);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase");

    expect(oppositeGenderEnemy.getStatStage(Stat.SPATK)).toBe(-2);
    expect(sameGenderEnemy.getStatStage(Stat.SPATK)).toBe(0);
  });

  it("should still lower Sp. Atk of an opposite-gender target when the first target is the same gender", async () => {
    await game.classicMode.startBattle(SpeciesId.NIDORAN_M, SpeciesId.NIDORAN_M);

    const [sameGenderEnemy, oppositeGenderEnemy] = game.scene.getEnemyParty();
    sameGenderEnemy.gender = Gender.MALE;
    oppositeGenderEnemy.gender = Gender.FEMALE;

    game.move.select(MoveId.CAPTIVATE, 0);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase");

    expect(sameGenderEnemy.getStatStage(Stat.SPATK)).toBe(0);
    expect(oppositeGenderEnemy.getStatStage(Stat.SPATK)).toBe(-2);
  });
});
