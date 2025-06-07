import { allMoves } from "#app/data/data-lists";
import type Pokemon from "#app/field/pokemon";
import { MoveId } from "#enums/move-id";
import { AbilityId } from "#enums/ability-id";
import { SpeciesId } from "#enums/species-id";
import { BerryModifier } from "#app/modifier/modifier";
import { BattleType } from "#enums/battle-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattlerIndex } from "#app/battle";

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
      .disableCrits()
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

  it("should not prevent item theft with PID of 0", async () => {
    game.override.enemyHeldItems([{ name: "BERRY", count: 1, type: BerryType.APICOT }]);

    vi.spyOn(allMoves[MoveId.THIEF], "chance", "get").mockReturnValue(100);

    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    // Override enemy pokemon PID to be 0
    enemy.id = 0;
    game.scene.getModifiers(BerryModifier, false).forEach(modifier => {
      modifier.pokemonId = enemy.id;
    });

    expect(enemy.getHeldItems()).toHaveLength(1);
    expect(player.getHeldItems()).toHaveLength(0);

    // Player uses Thief and steals the opponent's item
    game.move.use(MoveId.THIEF);
    await game.toNextTurn();

    expect(enemy.getHeldItems()).toHaveLength(0);
    expect(player.getHeldItems()).toHaveLength(1);
  });

  it("should not prevent Destiny Bond from triggering if user has PID of 0", async () => {
    await game.classicMode.startBattle([SpeciesId.TREECKO, SpeciesId.AERODACTYL]);

    const player = game.field.getPlayerPokemon();
    // Override player pokemon PID to be 0
    player.id = 0;
    expect(player.getTag(BattlerTagType.DESTINY_BOND)).toBeUndefined();

    game.move.use(MoveId.DESTINY_BOND);
    await game.move.forceEnemyMove(MoveId.FLARE_BLITZ);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    const dBondTag = player.getTag(BattlerTagType.DESTINY_BOND)!;
    expect(dBondTag).toBeDefined();
    expect(dBondTag.sourceId).toBe(0);

    await game.phaseInterceptor.to("MoveEndPhase");

    const enemy = game.scene.getEnemyPokemon();
    expect(player.isFainted()).toBe(true);
    expect(enemy).toBeUndefined();
    expect(player.getTag(BattlerTagType.DESTINY_BOND)).toBeUndefined();
  });
});
