import { BattlerIndex } from "#app/battle";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { MoveResult } from "#app/field/pokemon";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

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
    game.override.battleType("double");
    game.override.startingLevel(1);
    game.override.enemyLevel(100);
    game.override.ability(Abilities.NONE);
    game.override.moveset([Moves.GASTRO_ACID, Moves.WATER_GUN, Moves.SPLASH, Moves.CORE_ENFORCER]);
    game.override.enemySpecies(Species.BIDOOF);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemyAbility(Abilities.WATER_ABSORB);
  });

  it("suppresses effect of ability", async () => {
    /*
     * Expected flow (enemies have WATER ABSORD, can only use SPLASH)
     * - player mon 1 uses GASTRO ACID, player mon 2 uses SPLASH
     * - both player mons use WATER GUN on their respective enemy mon
     * - player mon 1 should have dealt damage, player mon 2 should have not
     */

    await game.startBattle();

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
  }, TIMEOUT);

  it("fails if used on an enemy with an already-suppressed ability", async () => {
    game.override.battleType(null);

    await game.startBattle();

    game.move.select(Moves.CORE_ENFORCER);
    // Force player to be slower to enable Core Enforcer to proc its suppression effect
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("TurnInitPhase");

    game.move.select(Moves.GASTRO_ACID);

    await game.phaseInterceptor.to("TurnInitPhase");

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  }, TIMEOUT);
});
