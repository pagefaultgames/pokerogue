import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

  it("should nullify all effects of Grass-type attacks and raise ATK by 1 stage", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    game.move.use(MoveId.LEAFAGE);
    await game.toNextTurn();

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("should work on grass status moves", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.use(MoveId.SPORE);
    await game.toNextTurn();

    expect(enemyPokemon.status).toBeUndefined();
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("should not activate on non Grass-type moves", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("should not activate against field-targeted moves", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    game.move.use(MoveId.GRASSY_TERRAIN);
    await game.toNextTurn();

    expect(game).toHaveTerrain(TerrainType.GRASSY);
    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, 0);
  });

  it("should trigger and cancel multi-hit moves, including ones called indirectly", async () => {
    game.move.forceMetronomeMove(MoveId.BULLET_SEED);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.BULLET_SEED);
    await game.toEndOfTurn();

    expect(enemy.hp).toBe(enemy.getMaxHp());
    expect(enemy.getStatStage(Stat.ATK)).toBe(1);
    expect(player.turnData.hitCount).toBe(1);

    game.move.use(MoveId.METRONOME);
    await game.toEndOfTurn();

    expect(enemy.hp).toBe(enemy.getMaxHp());
    expect(enemy.getStatStage(Stat.ATK)).toBe(2);
    expect(player.turnData.hitCount).toBe(1);
  });

  it("should not activate on self-targeted status moves", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPIKY_SHIELD);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(player.getTag(BattlerTagType.SPIKY_SHIELD)).toBeDefined();

    await game.toEndOfTurn();

    expect(player.getStatStage(Stat.ATK)).toBe(0);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("should activate even on missed moves", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    game.move.use(MoveId.LEAF_BLADE);
    await game.move.forceMiss();
    await game.toEndOfTurn();

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });
});
