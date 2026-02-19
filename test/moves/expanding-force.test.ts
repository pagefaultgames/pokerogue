import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Expanding Force", () => {
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
      .moveset([MoveId.EXPANDING_FORCE, MoveId.SPLASH])
      .battleStyle("double")
      .enemySpecies(SpeciesId.PIDGEY)
      .enemyMoveset([MoveId.PSYCHIC_TERRAIN, MoveId.SPLASH]);
  });

  it("recalculates spread-targeting when terrain appears mid-turn", async () => {
    await game.classicMode.startBattle(SpeciesId.MEWTWO, SpeciesId.RATTATA);

    game.move.select(MoveId.EXPANDING_FORCE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.forceEnemyMove(MoveId.PSYCHIC_TERRAIN);
    await game.move.forceEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to("BattleEndPhase");
    const enemyField = game.scene.getEnemyField();
    expect(enemyField[0].hp).toBeLessThan(enemyField[0].getMaxHp());
    expect(enemyField[1].hp).toBeLessThan(enemyField[1].getMaxHp());
  });

  it("doesn't spread when terrain is absent", async () => {
    // every enemy action is a filler so terrain never becomes active
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.SPLASH]);

    await game.classicMode.startBattle(SpeciesId.MEWTWO, SpeciesId.RATTATA);

    game.move.select(MoveId.EXPANDING_FORCE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

    // we only need to run through the first turn; the battle does not end here
    await game.phaseInterceptor.to("TurnEndPhase");
    const enemyField = game.scene.getEnemyField();
    // first foe should take damage, second remains untouched
    expect(enemyField[0].hp).toBeLessThan(enemyField[0].getMaxHp());
    expect(enemyField[1].hp).toBe(enemyField[1].getMaxHp());
  });

  it("doesn't spread when terrain changes to Electric mid-turn", async () => {
    await game.classicMode.startBattle(SpeciesId.MEWTWO, SpeciesId.RATTATA);

    game.move.select(MoveId.EXPANDING_FORCE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.forceEnemyMove(MoveId.ELECTRIC_TERRAIN);
    await game.move.forceEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to("TurnEndPhase");
    const enemyField = game.scene.getEnemyField();
    expect(enemyField[0].hp).toBeLessThan(enemyField[0].getMaxHp());
    expect(enemyField[1].hp).toBe(enemyField[1].getMaxHp());
  });

  it("doesn't spread when the user has Levitate", async () => {
    await game.classicMode.startBattle(SpeciesId.MEWTWO, SpeciesId.RATTATA);

    const mewtwo = game.field.getPlayerPokemon();
    const abilitySpy = game.field.mockAbility(mewtwo, AbilityId.LEVITATE);

    game.move.select(MoveId.EXPANDING_FORCE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.forceEnemyMove(MoveId.PSYCHIC_TERRAIN);
    await game.move.forceEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to("TurnEndPhase");
    const enemyField = game.scene.getEnemyField();
    expect(enemyField[0].hp).toBeLessThan(enemyField[0].getMaxHp());
    expect(enemyField[1].hp).toBe(enemyField[1].getMaxHp());

    abilitySpy.mockRestore();
  });
});
