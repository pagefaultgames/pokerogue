import { Gender } from "#data/gender";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Captivate", () => {
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
      .enemyMoveset(MoveId.SPLASH)
      .criticalHits(false);
  });

  it("should lower the Special Attack of all opposite-gender opponents by 2 stages", async () => {
    game.override.playerGender(Gender.FEMALE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const [enemy1, enemy2] = game.scene.getEnemyField();

    expect(feebas.isOppositeGender(enemy1)).toBe(true);
    expect(feebas.isOppositeGender(enemy2)).toBe(true);

    game.move.use(MoveId.CAPTIVATE);
    await game.toNextTurn();

    expect(feebas).toHaveUsedMove({
      move: MoveId.CAPTIVATE,
      targets: [BattlerIndex.ENEMY, BattlerIndex.ENEMY_2],
      result: MoveResult.SUCCESS,
    });
    expect(enemy1).toHaveStatStage(Stat.SPATK, -2);
    expect(enemy2).toHaveStatStage(Stat.SPATK, -2);

    // Reset summon data to clear stat stages & change opp. genders
    enemy1.resetSummonData();
    enemy2.resetSummonData();

    enemy1.gender = Gender.GENDERLESS;
    expect(feebas.isOppositeGender(enemy1)).toBe(false);

    game.move.use(MoveId.CAPTIVATE);
    await game.toNextTurn();

    // only opposite gendered enemy had stat lowered
    expect(enemy1).toHaveStatStage(Stat.SPATK, 0);
    expect(enemy2).toHaveStatStage(Stat.SPATK, -2);
  });

  it("should fail and do nothin if used by a genderless user", async () => {
    game.override.playerGender(Gender.GENDERLESS);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const [enemy1, enemy2] = game.scene.getEnemyField();
    expect(feebas.isOppositeGender(enemy1)).toBe(false);
    expect(feebas.isOppositeGender(enemy2)).toBe(false);

    game.move.use(MoveId.CAPTIVATE);
    await game.toNextTurn();

    // TODO: Status moves whose effects all fail to apply should fail the move
    // expect(feebas).toHaveUsedMove({ move: MoveId.CAPTIVATE, result: MoveResult.FAIL });
    expect(enemy1).toHaveStatStage(Stat.SPATK, 0);
    expect(enemy2).toHaveStatStage(Stat.SPATK, 0);
  });
});
