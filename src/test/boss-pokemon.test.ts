import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "./utils/gameManager";
import { Species } from "#app/enums/species";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { SPLASH_ONLY } from "./utils/testUtils";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { EFFECTIVE_STATS } from "#app/enums/stat";
import { EnemyPokemon } from "#app/field/pokemon";
import { toDmgValue } from "#app/utils";

describe("Boss Pokemon / Shields", () => {
  const TIMEOUT = 20 * 1000;

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
      .battleType("single")
      .disableTrainerWaves()
      .disableCrits()
      .enemySpecies(Species.RATTATA)
      .enemyMoveset(SPLASH_ONLY)
      .enemyHeldItems([])
      .startingLevel(1000)
      .moveset([Moves.FALSE_SWIPE, Moves.SUPER_FANG, Moves.SPLASH])
      .ability(Abilities.NO_GUARD);
  });

  it("Pokemon should get shields based on their Species and level and the current wave", async () => {
    let level = 50;
    let wave = 5;

    // On normal waves, no shields...
    expect(game.scene.getEncounterBossSegments(wave, level, getPokemonSpecies(Species.RATTATA))).toBe(0);
    // ... expect (sub)-legendary and mythical Pokemon who always get shields
    expect(game.scene.getEncounterBossSegments(wave, level, getPokemonSpecies(Species.MEW))).toBe(2);
    // Pokemon with 670+ BST get an extra shield
    expect(game.scene.getEncounterBossSegments(wave, level, getPokemonSpecies(Species.MEWTWO))).toBe(3);

    // Every 10 waves will always be a boss Pokemon with shield(s)
    wave = 50;
    expect(game.scene.getEncounterBossSegments(wave, level, getPokemonSpecies(Species.RATTATA))).toBe(2);
    // Every extra 250 waves adds a shield
    wave += 250;
    expect(game.scene.getEncounterBossSegments(wave, level, getPokemonSpecies(Species.RATTATA))).toBe(3);
    wave += 750;
    expect(game.scene.getEncounterBossSegments(wave, level, getPokemonSpecies(Species.RATTATA))).toBe(6);

    // Pokemon above level 100 get an extra shield
    level = 100;
    expect(game.scene.getEncounterBossSegments(wave, level, getPokemonSpecies(Species.RATTATA))).toBe(7);
  }, TIMEOUT);

  it("should reduce the number of shields if we are in a double battle", async () => {
    game.override
      .battleType("double")
      .startingWave(150); // Floor 150 > 2 shields / 3 health segments

    await game.classicMode.startBattle([ Species.MEWTWO ]);

    const boss1: EnemyPokemon = game.scene.getEnemyParty()[0]!;
    const boss2: EnemyPokemon = game.scene.getEnemyParty()[1]!;
    expect(boss1.isBoss()).toBe(true);
    expect(boss1.bossSegments).toBe(2);
    expect(boss2.isBoss()).toBe(true);
    expect(boss2.bossSegments).toBe(2);
  }, TIMEOUT);

  it("shields should stop overflow damage and give stat stage boosts when broken", async () => {
    game.override.startingWave(150); // Floor 150 > 2 shields / 3 health segments

    await game.classicMode.startBattle([ Species.MEWTWO ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const segmentHp = enemyPokemon.getMaxHp() / enemyPokemon.bossSegments;
    expect(enemyPokemon.isBoss()).toBe(true);
    expect(enemyPokemon.bossSegments).toBe(3);
    expect(getTotalStatStageBoosts(enemyPokemon)).toBe(0);

    game.move.select(Moves.SUPER_FANG); // Enough to break the first shield
    await game.toNextTurn();

    // Broke 1st of 2 shields, health at 2/3rd
    expect(enemyPokemon.bossSegmentIndex).toBe(1);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp() - toDmgValue(segmentHp));
    // Breaking the shield gives a +1 boost to ATK, DEF, SP ATK, SP DEF or SPD
    expect(getTotalStatStageBoosts(enemyPokemon)).toBe(1);

    game.move.select(Moves.FALSE_SWIPE); // Enough to break last shield but not kill
    await game.toNextTurn();

    expect(enemyPokemon.bossSegmentIndex).toBe(0);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp() - toDmgValue(2 * segmentHp));
    // Breaking the last shield gives a +2 boost to ATK, DEF, SP ATK, SP DEF or SPD
    expect(getTotalStatStageBoosts(enemyPokemon)).toBe(3);

  }, TIMEOUT);

  it("breaking multiple shields at once requires extra damage", async () => {
    game.override
      .battleType("double")
      .enemyHealthSegments(5);

    await game.classicMode.startBattle([ Species.MEWTWO ]);

    // In this test we want to break through 3 shields at once
    const brokenShields = 3;

    const boss1: EnemyPokemon = game.scene.getEnemyParty()[0]!;
    const boss1SegmentHp = boss1.getMaxHp() / boss1.bossSegments;
    const requiredDamageBoss1 = boss1SegmentHp * (1 + Math.pow(2, brokenShields));
    expect(boss1.isBoss()).toBe(true);
    expect(boss1.bossSegments).toBe(5);
    expect(boss1.bossSegmentIndex).toBe(4);

    // Not enough damage to break through all shields
    boss1.damageAndUpdate(Math.floor(requiredDamageBoss1 - 5));
    expect(boss1.bossSegmentIndex).toBe(1);
    expect(boss1.hp).toBe(boss1.getMaxHp() - toDmgValue(boss1SegmentHp * 3));

    const boss2: EnemyPokemon = game.scene.getEnemyParty()[1]!;
    const boss2SegmentHp = boss2.getMaxHp() / boss2.bossSegments;
    const requiredDamageBoss2 = boss2SegmentHp * (1 + Math.pow(2, brokenShields));

    expect(boss2.isBoss()).toBe(true);
    expect(boss2.bossSegments).toBe(5);

    // Enough damage to break through all shields
    boss2.damageAndUpdate(Math.ceil(requiredDamageBoss2));
    expect(boss2.bossSegmentIndex).toBe(0);
    expect(boss2.hp).toBe(boss2.getMaxHp() - toDmgValue(boss2SegmentHp * 4));

  }, TIMEOUT);

  it("the number of stat stage boosts is consistent when several shields are broken at once", async () => {
    const shieldsToBreak = 4;

    game.override
      .battleType("double")
      .enemyHealthSegments(shieldsToBreak + 1);

    await game.classicMode.startBattle([ Species.MEWTWO ]);

    const boss1: EnemyPokemon = game.scene.getEnemyParty()[0]!;
    const boss1SegmentHp = boss1.getMaxHp() / boss1.bossSegments;
    const singleShieldDamage = Math.ceil(boss1SegmentHp);
    expect(boss1.isBoss()).toBe(true);
    expect(boss1.bossSegments).toBe(shieldsToBreak + 1);
    expect(boss1.bossSegmentIndex).toBe(shieldsToBreak);
    expect(getTotalStatStageBoosts(boss1)).toBe(0);


    let totalStatStages = 0;

    // Break the shields one by one
    for (let i = 1; i <= shieldsToBreak; i++) {
      boss1.damageAndUpdate(singleShieldDamage);
      expect(boss1.bossSegmentIndex).toBe(shieldsToBreak - i);
      expect(boss1.hp).toBe(boss1.getMaxHp() - toDmgValue(boss1SegmentHp * i));
      // Do nothing and go to next turn so that the StatStageChangePhase gets applied
      game.move.select(Moves.SPLASH);
      await game.toNextTurn();
      // All broken shields give +1 stat boost, except the last two that gives +2
      totalStatStages += i >= shieldsToBreak -1? 2 : 1;
      expect(getTotalStatStageBoosts(boss1)).toBe(totalStatStages);
    }

    const boss2: EnemyPokemon = game.scene.getEnemyParty()[1]!;
    const boss2SegmentHp = boss2.getMaxHp() / boss2.bossSegments;
    const requiredDamage = boss2SegmentHp * (1 + Math.pow(2, shieldsToBreak - 1));

    expect(boss2.isBoss()).toBe(true);
    expect(boss2.bossSegments).toBe(shieldsToBreak + 1);
    expect(boss2.bossSegmentIndex).toBe(shieldsToBreak);
    expect(getTotalStatStageBoosts(boss2)).toBe(0);

    // Enough damage to break all shields at once
    boss2.damageAndUpdate(Math.ceil(requiredDamage));
    expect(boss2.bossSegmentIndex).toBe(0);
    expect(boss2.hp).toBe(boss2.getMaxHp() - toDmgValue(boss2SegmentHp * shieldsToBreak));
    // Do nothing and go to next turn so that the StatStageChangePhase gets applied
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();
    expect(getTotalStatStageBoosts(boss2)).toBe(totalStatStages);

  }, TIMEOUT);

  /**
   * Gets the sum of the effective stat stage boosts for the given Pokemon
   * @param enemyPokemon the pokemon to get stats from
   * @returns the total stats boosts
   */
  function getTotalStatStageBoosts(enemyPokemon: EnemyPokemon): number {
    let boosts = 0;
    for (const s of EFFECTIVE_STATS) {
      boosts += enemyPokemon.getStatStage(s);
    }
    return boosts;
  }
});

