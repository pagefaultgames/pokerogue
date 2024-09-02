import { StatusEffect } from "#app/data/status-effect";
import { Abilities } from "#app/enums/abilities";
import { Biome } from "#app/enums/biome";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { GameModes } from "#app/game-mode";
import { TurnHeldItemTransferModifier } from "#app/modifier/modifier";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "./utils/gameManager";
import { SPLASH_ONLY } from "./utils/testUtils";

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
      .startingBiome(Biome.END)
      .disableCrits()
      .enemyMoveset(SPLASH_ONLY)
      .moveset([ Moves.SPLASH, Moves.WILL_O_WISP, Moves.DRAGON_PULSE ])
      .startingLevel(10000);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should spawn Eternatus on wave 200 in END biome", async () => {
    await game.runToFinalBossEncounter([Species.BIDOOF], GameModes.CLASSIC);

    expect(game.scene.currentBattle.waveIndex).toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).toBe(Biome.END);
    expect(game.scene.getEnemyPokemon()!.species.speciesId).toBe(Species.ETERNATUS);
  });

  it("should NOT spawn Eternatus before wave 200 in END biome", async () => {
    game.override.startingWave(FinalWave.Classic - 1);
    await game.runToFinalBossEncounter([Species.BIDOOF], GameModes.CLASSIC);

    expect(game.scene.currentBattle.waveIndex).not.toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).toBe(Biome.END);
    expect(game.scene.getEnemyPokemon()!.species.speciesId).not.toBe(Species.ETERNATUS);
  });

  it("should NOT spawn Eternatus outside of END biome", async () => {
    game.override.startingBiome(Biome.FOREST);
    await game.runToFinalBossEncounter([Species.BIDOOF], GameModes.CLASSIC);

    expect(game.scene.currentBattle.waveIndex).toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).not.toBe(Biome.END);
    expect(game.scene.getEnemyPokemon()!.species.speciesId).not.toBe(Species.ETERNATUS);
  });

  it("should not have passive enabled on Eternatus", async () => {
    await game.runToFinalBossEncounter([Species.BIDOOF], GameModes.CLASSIC);

    const eternatus = game.scene.getEnemyPokemon()!;
    expect(eternatus.species.speciesId).toBe(Species.ETERNATUS);
    expect(eternatus.hasPassive()).toBe(false);
  });

  it("should change form on direct hit down to last boss fragment", async () => {
    await game.runToFinalBossEncounter([Species.KYUREM], GameModes.CLASSIC);
    await game.phaseInterceptor.to("CommandPhase");

    // Eternatus phase 1
    const eternatus = game.scene.getEnemyPokemon()!;
    const phase1Hp = eternatus.getMaxHp();
    expect(eternatus.species.speciesId).toBe(Species.ETERNATUS);
    expect(eternatus.formIndex).toBe(0);
    expect(eternatus.bossSegments).toBe(4);
    expect(eternatus.bossSegmentIndex).toBe(3);

    game.move.select(Moves.DRAGON_PULSE);
    await game.toNextTurn();

    // Eternatus phase 2: changed form, healed and restored its shields
    expect(eternatus.species.speciesId).toBe(Species.ETERNATUS);
    expect(eternatus.hp).toBeGreaterThan(phase1Hp);
    expect(eternatus.hp).toBe(eternatus.getMaxHp());
    expect(eternatus.formIndex).toBe(1);
    expect(eternatus.bossSegments).toBe(5);
    expect(eternatus.bossSegmentIndex).toBe(4);
    const miniBlackHole = eternatus.getHeldItems().find(m => m instanceof TurnHeldItemTransferModifier);
    expect(miniBlackHole).toBeDefined();
    expect(miniBlackHole?.stackCount).toBe(1);
  });

  it("should change form on status damage down to last boss fragment", async () => {
    game.override.ability(Abilities.NO_GUARD);

    await game.runToFinalBossEncounter([Species.BIDOOF], GameModes.CLASSIC);
    await game.phaseInterceptor.to("CommandPhase");

    // Eternatus phase 1
    const eternatus = game.scene.getEnemyPokemon()!;
    const phase1Hp = eternatus.getMaxHp();
    expect(eternatus.species.speciesId).toBe(Species.ETERNATUS);
    expect(eternatus.formIndex).toBe(0);
    expect(eternatus.bossSegments).toBe(4);
    expect(eternatus.bossSegmentIndex).toBe(3);

    game.move.select(Moves.WILL_O_WISP);
    await game.toNextTurn();
    expect(eternatus.status?.effect).toBe(StatusEffect.BURN);

    const tickDamage = phase1Hp - eternatus.hp;
    const lastShieldHp = Math.ceil(phase1Hp / eternatus.bossSegments);
    // Stall until the burn is one hit away from breaking the last shield
    while (eternatus.hp - tickDamage > lastShieldHp) {
      game.move.select(Moves.SPLASH);
      await game.toNextTurn();
    }

    expect(eternatus.bossSegmentIndex).toBe(1);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    // Eternatus phase 2: changed form, healed and restored its shields
    expect(eternatus.hp).toBeGreaterThan(phase1Hp);
    expect(eternatus.hp).toBe(eternatus.getMaxHp());
    expect(eternatus.status).toBeFalsy();
    expect(eternatus.formIndex).toBe(1);
    expect(eternatus.bossSegments).toBe(5);
    expect(eternatus.bossSegmentIndex).toBe(4);
    const miniBlackHole = eternatus.getHeldItems().find(m => m instanceof TurnHeldItemTransferModifier);
    expect(miniBlackHole).toBeDefined();
    expect(miniBlackHole?.stackCount).toBe(1);
  });

});
