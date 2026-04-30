import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Expanding Force", () => {
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
      .criticalHits(false)
      .battleStyle("double")
      .enemySpecies(SpeciesId.MAGIKARP)
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingTerrain(TerrainType.PSYCHIC);
  });

  it("should hit both opponents if the user is grounded on Psychic terrain", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.use(MoveId.EXPANDING_FORCE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(game).toHaveTerrain(TerrainType.PSYCHIC);

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({
      move: MoveId.EXPANDING_FORCE,
      targets: [BattlerIndex.ENEMY, BattlerIndex.ENEMY_2],
    });
    const [karp1, karp2] = game.scene.getEnemyField();
    expect(karp1).not.toHaveFullHp();
    expect(karp2).not.toHaveFullHp();
  });

  it("should remain single-target if the user is airborne", async () => {
    game.override.ability(AbilityId.LEVITATE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    expect(feebas.isGrounded()).toBe(false);

    game.move.use(MoveId.EXPANDING_FORCE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move: MoveId.EXPANDING_FORCE, targets: [BattlerIndex.ENEMY] });
    const [karp1, karp2] = game.scene.getEnemyField();
    expect(karp1).not.toHaveFullHp();
    expect(karp2).toHaveFullHp();
  });

  it("should respect mid-turn terrain changes, using prior target selection if removed mid-turn", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.EXPANDING_FORCE, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.move.forceEnemyMove(MoveId.ELECTRIC_TERRAIN);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    // lack of terrain turned move into single target, hitting enemy 2
    expect(game).toHaveTerrain(TerrainType.ELECTRIC);
    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({ move: MoveId.EXPANDING_FORCE, targets: [BattlerIndex.ENEMY_2] });
    const [karp1, karp2] = game.scene.getEnemyField();
    expect(karp2).not.toHaveFullHp();
    expect(karp1).toHaveFullHp();

    // repeat, but enabling the terrain mid-turn instead
    karp1.hp = karp1.getMaxHp();

    game.move.use(MoveId.EXPANDING_FORCE, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.move.forceEnemyMove(MoveId.PSYCHIC_TERRAIN);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({
      move: MoveId.EXPANDING_FORCE,
      targets: [BattlerIndex.ENEMY, BattlerIndex.ENEMY_2],
    });
    expect(karp1).not.toHaveFullHp();
    expect(karp2).not.toHaveFullHp();
  });
});
