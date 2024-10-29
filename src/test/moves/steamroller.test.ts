import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { DamageCalculationResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Steamroller", () => {
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
    game.override.moveset([ Moves.STEAMROLLER ]).battleType("single").enemyAbility(Abilities.BALL_FETCH);
  });

  it("should always hit a minimzed target with double damage", async () => {
    game.override.enemySpecies(Species.DITTO).enemyMoveset(Moves.MINIMIZE);
    await game.classicMode.startBattle([ Species.IRON_BOULDER ]);

    const ditto = game.scene.getEnemyPokemon()!;
    vi.spyOn(ditto, "getAttackDamage");
    ditto.hp = 5000;
    const steamroller = allMoves[Moves.STEAMROLLER];
    vi.spyOn(steamroller, "calculateBattleAccuracy");
    const ironBoulder = game.scene.getPlayerPokemon()!;
    vi.spyOn(ironBoulder, "getAccuracyMultiplier");
    // Turn 1
    game.move.select(Moves.STEAMROLLER);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.toNextTurn();
    // Turn 2
    game.move.select(Moves.STEAMROLLER);
    await game.toNextTurn();

    const [ dmgCalcTurn1, dmgCalcTurn2 ]: DamageCalculationResult[] = vi
      .mocked(ditto.getAttackDamage)
      .mock.results.map((r) => r.value);

    expect(dmgCalcTurn2.damage).toBeGreaterThanOrEqual(dmgCalcTurn1.damage * 2);
    expect(ditto.getTag(BattlerTagType.MINIMIZED)).toBeDefined();
    expect(steamroller.calculateBattleAccuracy).toHaveReturnedWith(-1);
  });
});
