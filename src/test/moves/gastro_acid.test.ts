import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "../utils/gameManager";
import {
  Moves
} from "#app/enums/moves.js";
import * as overrides from "#app/overrides";
import { Abilities } from "#app/enums/abilities.js";
import { BattlerIndex } from "#app/battle.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { MoveResult } from "#app/field/pokemon.js";
import { Stat } from "#app/data/pokemon-stat.js";
import { Species } from "#app/enums/species.js";

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
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(1);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.GASTRO_ACID, Moves.WATER_GUN, Moves.SPLASH, Moves.CORE_ENFORCER]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.BIDOOF);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.WATER_ABSORB);
  });

  it("suppresses effect of ability", async () => {
    /*
     * Expected flow (enemies have WATER ABSORD, can only use SPLASH)
     * - player mon 1 uses GASTRO ACID, player mon 2 uses SPLASH
     * - both player mons use WATER GUN on their respective enemy mon
     * - player mon 1 should have dealt damage, player mon 2 should have not
     */

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.GASTRO_ACID));
    game.doSelectTarget(BattlerIndex.ENEMY);
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doSelectTarget(BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("TurnInitPhase");

    const enemyField = game.scene.getEnemyField();
    expect(enemyField[0].summonData.abilitySuppressed).toBe(true);
    expect(enemyField[1].summonData.abilitySuppressed).toBe(false);

    game.doAttack(getMovePosition(game.scene, 0, Moves.WATER_GUN));
    game.doSelectTarget(BattlerIndex.ENEMY);
    game.doAttack(getMovePosition(game.scene, 0, Moves.WATER_GUN));
    game.doSelectTarget(BattlerIndex.ENEMY_2);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemyField[0].hp).toBeLessThan(enemyField[0].getMaxHp());
    expect(enemyField[1].hp).toBe(enemyField[1].getMaxHp());
  }, TIMEOUT);

  it("fails if used on an enemy with an already-suppressed ability", async () => {
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);

    await game.startBattle();

    // Force player to be slower to enable Core Enforcer to proc its suppression effect
    game.scene.getPlayerPokemon().stats[Stat.SPD] = 1;
    game.scene.getEnemyPokemon().stats[Stat.SPD] = 2;

    game.doAttack(getMovePosition(game.scene, 0, Moves.CORE_ENFORCER));

    await game.phaseInterceptor.to("TurnInitPhase");

    game.doAttack(getMovePosition(game.scene, 0, Moves.GASTRO_ACID));

    await game.phaseInterceptor.to("TurnInitPhase");

    expect(game.scene.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  }, TIMEOUT);
});
