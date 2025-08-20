import { AbilityId } from "#enums/ability-id";
import { BiomeId } from "#enums/biome-id";
import { GameModes } from "#enums/game-modes";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TurnHeldItemTransferModifier } from "#modifiers/modifier";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const FinalWave = {
  Classic: 200,
};

describe("Final Boss", () => {
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
      .startingWave(FinalWave.Classic)
      .startingBiome(BiomeId.END)
      .criticalHits(false)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(10000);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should spawn Eternatus on wave 200 in END biome", async () => {
    await game.runToFinalBossEncounter([SpeciesId.BIDOOF], GameModes.CLASSIC);

    expect(game.scene.currentBattle.waveIndex).toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).toBe(BiomeId.END);
    expect(game.field.getEnemyPokemon().species.speciesId).toBe(SpeciesId.ETERNATUS);
  });

  it("should NOT spawn Eternatus before wave 200 in END biome", async () => {
    game.override.startingWave(FinalWave.Classic - 1);
    await game.runToFinalBossEncounter([SpeciesId.BIDOOF], GameModes.CLASSIC);

    expect(game.scene.currentBattle.waveIndex).not.toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).toBe(BiomeId.END);
    expect(game.field.getEnemyPokemon().species.speciesId).not.toBe(SpeciesId.ETERNATUS);
  });

  it("should NOT spawn Eternatus outside of END biome", async () => {
    game.override.startingBiome(BiomeId.FOREST);
    await game.runToFinalBossEncounter([SpeciesId.BIDOOF], GameModes.CLASSIC);

    expect(game.scene.currentBattle.waveIndex).toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).not.toBe(BiomeId.END);
    expect(game.field.getEnemyPokemon().species.speciesId).not.toBe(SpeciesId.ETERNATUS);
  });

  it("should initially spawn in regular form without passive & 4 boss segments", async () => {
    await game.runToFinalBossEncounter([SpeciesId.BIDOOF], GameModes.CLASSIC);

    const eternatus = game.field.getEnemyPokemon();
    expect(eternatus.formIndex).toBe(0);
    expect(eternatus.bossSegments).toBe(4);
    expect(eternatus.bossSegmentIndex).toBe(3);
    expect(eternatus.species.speciesId).toBe(SpeciesId.ETERNATUS);
    expect(eternatus.hasPassive()).toBe(false);
  });

  it("should change form on direct hit down to last boss fragment", async () => {
    await game.runToFinalBossEncounter([SpeciesId.KYUREM], GameModes.CLASSIC);

    // phase 1
    const eternatus = game.field.getEnemyPokemon();
    const phase1Hp = eternatus.getMaxHp();

    game.move.use(MoveId.DRAGON_PULSE);
    await game.toNextTurn();

    // Eternatus phase 2: changed form, healed fully and restored its shields
    expect(eternatus.species.speciesId).toBe(SpeciesId.ETERNATUS);
    expect(eternatus.hp).toBe(eternatus.getMaxHp());
    expect(eternatus.getMaxHp()).toBeGreaterThan(phase1Hp);
    expect(eternatus.formIndex).toBe(1);
    expect(eternatus.bossSegments).toBe(5);
    expect(eternatus.bossSegmentIndex).toBe(4);
    const miniBlackHole = eternatus.getHeldItems().find(m => m instanceof TurnHeldItemTransferModifier);
    expect(miniBlackHole).toBeDefined();
    expect(miniBlackHole?.stackCount).toBe(1);
  });

  it("should change form on status damage down to last boss fragment", async () => {
    game.override.ability(AbilityId.NO_GUARD);
    await game.runToFinalBossEncounter([SpeciesId.SALAZZLE], GameModes.CLASSIC);

    // Eternatus phase 1
    const eternatus = game.field.getEnemyPokemon();
    const phase1Hp = eternatus.getMaxHp();

    game.move.use(MoveId.WILL_O_WISP);
    await game.toNextTurn();
    expect(eternatus.status?.effect).toBe(StatusEffect.BURN);

    const tickDamage = phase1Hp - eternatus.hp;
    const lastShieldHp = Math.ceil(phase1Hp / eternatus.bossSegments);
    // Stall until the burn is one hit away from breaking the last shield
    while (eternatus.hp - tickDamage > lastShieldHp) {
      game.move.use(MoveId.SPLASH);
      await game.toNextTurn();
    }

    expect(eternatus.bossSegmentIndex).toBe(1);

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    // Eternatus phase 2: changed form, healed and restored its shields
    expect(eternatus.hp).toBeGreaterThan(phase1Hp);
    expect(eternatus.hp).toBe(eternatus.getMaxHp());
    expect(eternatus.status?.effect).toBeUndefined();
    expect(eternatus.formIndex).toBe(1);
    expect(eternatus.bossSegments).toBe(5);
    expect(eternatus.bossSegmentIndex).toBe(4);
    const miniBlackHole = eternatus.getHeldItems().find(m => m instanceof TurnHeldItemTransferModifier);
    expect(miniBlackHole).toBeDefined();
    expect(miniBlackHole?.stackCount).toBe(1);
  });
});
