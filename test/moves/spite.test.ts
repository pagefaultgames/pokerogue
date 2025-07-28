import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Spite", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should reduce the PP of the target's last move by 4", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const karp = game.field.getEnemyPokemon();
    game.move.changeMoveset(karp, [MoveId.SPLASH, MoveId.TACKLE]);

    game.move.use(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(karp).toHaveUsedPP(MoveId.TACKLE, 1);

    game.move.use(MoveId.SPITE);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(karp).toHaveUsedPP(MoveId.TACKLE, 4 + 1);
  });

  it("should fail if the target has not used a move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const karp = game.field.getEnemyPokemon();
    game.move.changeMoveset(karp, [MoveId.SPLASH, MoveId.TACKLE]);

    game.move.use(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({});
    expect(karp).toHaveUsedPP(MoveId.TACKLE, 1);

    game.move.use(MoveId.SPITE);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(karp).toHaveUsedPP(MoveId.TACKLE, 4 + 1);
  });

  it("should ignore virtual or Dancer-induced moves", async () => {
    game.override.battleStyle("double").enemyAbility(AbilityId.DANCER);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [karp1, karp2] = game.scene.getEnemyField();
    game.move.changeMoveset(karp1, [MoveId.SPLASH, MoveId.METRONOME]);
    game.move.changeMoveset(karp2, [MoveId.SWORDS_DANCE, MoveId.TACKLE]);

    game.move.use(MoveId.SPITE);
    await game.move.selectEnemyMove(MoveId.METRONOME);
    await game.move.selectEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(karp).toHaveUsedPP(MoveId.TACKLE, 1);

    game.move.use(MoveId.SPITE);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(karp).toHaveUsedPP(MoveId.TACKLE, 4 + 1);
  });
});
