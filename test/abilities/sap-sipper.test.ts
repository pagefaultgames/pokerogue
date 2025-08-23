import { allMoves } from "#data/data-lists";
import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { RandomMoveAttr } from "#moves/move";
import { MoveEndPhase } from "#phases/move-end-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// See also: TypeImmunityAbAttr
describe("Abilities - Sap Sipper", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.SAP_SIPPER)
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.SAP_SIPPER)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("raises ATK stat stage by 1 and block effects when activated against a grass attack", async () => {
    const moveToUse = MoveId.LEAFAGE;

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const initialEnemyHp = enemyPokemon.hp;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(initialEnemyHp - enemyPokemon.hp).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("raises ATK stat stage by 1 and block effects when activated against a grass status move", async () => {
    const moveToUse = MoveId.SPORE;

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.status).toBeUndefined();
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("do not activate against status moves that target the field", async () => {
    const moveToUse = MoveId.GRASSY_TERRAIN;

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.arena.terrain).toBeDefined();
    expect(game.scene.arena.terrain!.terrainType).toBe(TerrainType.GRASSY);
    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(0);
  });

  it("activate once against multi-hit grass attacks", async () => {
    const moveToUse = MoveId.BULLET_SEED;

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const initialEnemyHp = enemyPokemon.hp;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(initialEnemyHp - enemyPokemon.hp).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("do not activate against status moves that target the user", async () => {
    const moveToUse = MoveId.SPIKY_SHIELD;

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(playerPokemon.getTag(BattlerTagType.SPIKY_SHIELD)).toBeDefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("activate once against multi-hit grass attacks (metronome)", async () => {
    const moveToUse = MoveId.METRONOME;

    const randomMoveAttr = allMoves[MoveId.METRONOME].findAttr(
      attr => attr instanceof RandomMoveAttr,
    ) as RandomMoveAttr;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.BULLET_SEED);

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const initialEnemyHp = enemyPokemon.hp;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(initialEnemyHp - enemyPokemon.hp).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("still activates regardless of accuracy check", async () => {
    game.override.moveset(MoveId.LEAF_BLADE);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.LEAF_BLADE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    await game.move.forceMiss();
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });
});
