import { allMoves } from "#app/data/data-lists";
import type Pokemon from "#app/field/pokemon";
import { MoveId } from "#enums/move-id";
import { AbilityId } from "#enums/ability-id";
import { SpeciesId } from "#enums/species-id";
import { BerryModifier } from "#app/modifier/modifier";
import { BattleType } from "#enums/battle-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset(MoveId.SPLASH)
      .ability(AbilityId.NO_GUARD)
      .battleStyle("single")
      .disableCrits()
      .enemyLevel(100)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  function onlyUnique<T>(array: T[]): T[] {
    return [...new Set<T>(array)];
  }

  // TODO: We currently generate IDs as a pure random integer; remove once unique UUIDs are added
  it.todo("2 Pokemon should not be able to generate with the same ID during 1 encounter", async () => {
    game.override.battleType(BattleType.TRAINER); // enemy generates 2 mons
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.ABRA]);

    const ids = (game.scene.getPlayerParty() as Pokemon[]).concat(game.scene.getEnemyParty()).map((p: Pokemon) => p.id);
    const uniqueIds = onlyUnique(ids);

    expect(ids).toHaveLength(uniqueIds.length);
  });

  it("should not prevent item theft with PID of 0", async () => {
    game.override
      .moveset([MoveId.THIEF, MoveId.SPLASH])
      .enemyHeldItems([{ name: "BERRY", count: 1, type: BerryType.APICOT }]);

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
    game.move.select(MoveId.THIEF);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.getHeldItems()).toHaveLength(0);
    expect(player.getHeldItems()).toHaveLength(1);
  });

  it("should not prevent Syrup Bomb triggering if user has PID of 0", async () => {
    game.override.moveset(MoveId.SYRUP_BOMB);
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const player = game.scene.getPlayerPokemon()!;
    // Override player pokemon PID to be 0
    player.id = 0;

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy.getTag(BattlerTagType.SYRUP_BOMB)).toBeUndefined();

    game.move.select(MoveId.SYRUP_BOMB);
    await game.phaseInterceptor.to("TurnEndPhase");

    const syrupTag = enemy.getTag(BattlerTagType.SYRUP_BOMB)!;
    expect(syrupTag).toBeDefined();
    expect(syrupTag.getSourcePokemon()).toBe(player);
    expect(enemy.getStatStage(Stat.SPD)).toBe(-1);
  });
});
