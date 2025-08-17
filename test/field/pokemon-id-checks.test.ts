import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Field - Pokemon ID Checks", () => {
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
      .ability(AbilityId.NO_GUARD)
      .battleStyle("single")
      .battleType(BattleType.TRAINER)
      .criticalHits(false)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.ARCANINE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  function onlyUnique<T>(array: T[]): T[] {
    return [...new Set<T>(array)];
  }

  // TODO: We currently generate IDs as a pure random integer; enable once unique UUIDs are added
  it.todo("2 Pokemon should not be able to generate with the same ID during 1 encounter", async () => {
    game.override.battleType(BattleType.TRAINER); // enemy generates 2 mons
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.ABRA]);

    const ids = (game.scene.getPlayerParty() as Pokemon[]).concat(game.scene.getEnemyParty()).map((p: Pokemon) => p.id);
    const uniqueIds = onlyUnique(ids);

    expect(ids).toHaveLength(uniqueIds.length);
  });

  it("should not prevent Battler Tags from triggering if user has PID of 0", async () => {
    await game.classicMode.startBattle([SpeciesId.TREECKO, SpeciesId.AERODACTYL]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    // Override player pokemon PID to be 0
    player.id = 0;
    expect(player.getTag(BattlerTagType.DESTINY_BOND)).toBeUndefined();

    game.move.use(MoveId.DESTINY_BOND);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.FLAME_WHEEL);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    const dBondTag = player.getTag(BattlerTagType.DESTINY_BOND)!;
    expect(dBondTag).toBeDefined();
    expect(dBondTag.sourceId).toBe(0);
    expect(dBondTag.getSourcePokemon()).toBe(player);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(player.isFainted()).toBe(true);
    expect(enemy.isFainted()).toBe(true);
  });
});
