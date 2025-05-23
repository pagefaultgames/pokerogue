import { BattlerIndex } from "#app/battle";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { MoveResult } from "#app/field/pokemon";
import GameManager from "#test/testUtils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Gastro Acid", () => {
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
    game.override.battleStyle("double");
    game.override.startingLevel(1);
    game.override.enemyLevel(100);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.moveset([Moves.GASTRO_ACID, Moves.WATER_GUN, Moves.SPLASH, Moves.CORE_ENFORCER]);
    game.override.enemySpecies(Species.BIDOOF);
    game.override.enemyMoveset(Moves.SPLASH);
    game.override.enemyAbility(Abilities.WATER_ABSORB);
  });

  it("suppresses effect of ability", async () => {
    /*
     * Expected flow (enemies have WATER ABSORD, can only use SPLASH)
     * - player mon 1 uses GASTRO ACID, player mon 2 uses SPLASH
     * - both player mons use WATER GUN on their respective enemy mon
     * - player mon 1 should have dealt damage, player mon 2 should have not
     */

    await game.classicMode.startBattle();

    game.move.select(Moves.GASTRO_ACID, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("TurnInitPhase");

    const enemyField = game.scene.getEnemyField();
    expect(enemyField[0].summonData.abilitySuppressed).toBe(true);
    expect(enemyField[1].summonData.abilitySuppressed).toBe(false);

    game.move.select(Moves.WATER_GUN, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.WATER_GUN, 1, BattlerIndex.ENEMY_2);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemyField[0].hp).toBeLessThan(enemyField[0].getMaxHp());
    expect(enemyField[1].isFullHp()).toBe(true);
  });

  it("fails if used on an enemy with an already-suppressed ability", async () => {
    game.override.battleStyle("single");

    await game.classicMode.startBattle();

    game.move.select(Moves.CORE_ENFORCER);
    // Force player to be slower to enable Core Enforcer to proc its suppression effect
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("TurnInitPhase");

    game.move.select(Moves.GASTRO_ACID);

    await game.phaseInterceptor.to("TurnInitPhase");

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should suppress the passive of a target even if its main ability is unsuppressable and not suppress main abli", async () => {
    game.override
      .enemyAbility(Abilities.COMATOSE)
      .enemyPassiveAbility(Abilities.WATER_ABSORB)
      .moveset([Moves.SPLASH, Moves.GASTRO_ACID, Moves.WATER_GUN]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const enemyPokemon = game.scene.getEnemyPokemon();

    game.move.select(Moves.GASTRO_ACID);
    await game.toNextTurn();
    expect(enemyPokemon?.summonData.abilitySuppressed).toBe(true);

    game.move.select(Moves.WATER_GUN);
    await game.toNextTurn();
    expect(enemyPokemon?.getHpRatio()).toBeLessThan(1);

    game.move.select(Moves.SPORE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon?.status?.effect).toBeFalsy();
  });
});
