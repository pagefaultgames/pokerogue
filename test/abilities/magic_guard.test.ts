import { getArenaTag } from "#app/data/arena-tag";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { getStatusEffectCatchRateMultiplier } from "#app/data/status-effect";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Magic Guard", () => {
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
      /** Player Pokemon overrides */
      .ability(AbilityId.MAGIC_GUARD)
      .moveset([MoveId.SPLASH])
      .startingLevel(100)
      /** Enemy Pokemon overrides */
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Magic_Guard_(Ability)

  it("ability should prevent damage caused by weather", async () => {
    game.override.weather(WeatherType.SANDSTORM);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    expect(enemyPokemon).toBeDefined();

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) has not taken damage from weather
     * - The enemy Pokemon (without Magic Guard) has taken damage from weather
     */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  it("ability should prevent damage caused by status effects but other non-damage effects still apply", async () => {
    //Toxic keeps track of the turn counters -> important that Magic Guard keeps track of post-Toxic turns
    game.override.statusEffect(StatusEffect.POISON);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) has not taken damage from poison
     * - The Pokemon's CatchRateMultiplier should be 1.5
     */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(getStatusEffectCatchRateMultiplier(leadPokemon.status!.effect)).toBe(1.5);
  });

  it("ability effect should not persist when the ability is replaced", async () => {
    game.override.enemyMoveset(MoveId.WORRY_SEED).statusEffect(StatusEffect.POISON);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (that just lost its Magic Guard ability) has taken damage from poison
     */
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
  });

  it("Magic Guard prevents damage caused by burn but other non-damaging effects are still applied", async () => {
    game.override.enemyStatusEffect(StatusEffect.BURN).enemyAbility(AbilityId.MAGIC_GUARD);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPLASH);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The enemy Pokemon (with Magic Guard) has not taken damage from burn
     * - The enemy Pokemon's physical attack damage is halved (TBD)
     * - The enemy Pokemon's hypothetical CatchRateMultiplier should be 1.5
     */
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(getStatusEffectCatchRateMultiplier(enemyPokemon.status!.effect)).toBe(1.5);
  });

  it("Magic Guard prevents damage caused by toxic but other non-damaging effects are still applied", async () => {
    game.override.enemyStatusEffect(StatusEffect.TOXIC).enemyAbility(AbilityId.MAGIC_GUARD);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPLASH);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    const toxicStartCounter = enemyPokemon.status!.toxicTurnCount;
    //should be 0

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The enemy Pokemon (with Magic Guard) has not taken damage from toxic
     * - The enemy Pokemon's status effect duration should be incremented
     * - The enemy Pokemon's hypothetical CatchRateMultiplier should be 1.5
     */
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(enemyPokemon.status!.toxicTurnCount).toBeGreaterThan(toxicStartCounter);
    expect(getStatusEffectCatchRateMultiplier(enemyPokemon.status!.effect)).toBe(1.5);
  });

  it("Magic Guard prevents damage caused by entry hazards", async () => {
    //Adds and applies Spikes to both sides of the arena
    const newTag = getArenaTag(ArenaTagType.SPIKES, 5, MoveId.SPIKES, 0, 0, ArenaTagSide.BOTH)!;
    game.scene.arena.tags.push(newTag);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.SPLASH);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) has not taken damage from spikes
     * - The enemy Pokemon (without Magic Guard) has taken damage from spikes
     */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  it("Magic Guard does not prevent poison from Toxic Spikes", async () => {
    //Adds and applies Spikes to both sides of the arena
    const playerTag = getArenaTag(ArenaTagType.TOXIC_SPIKES, 5, MoveId.TOXIC_SPIKES, 0, 0, ArenaTagSide.PLAYER)!;
    const enemyTag = getArenaTag(ArenaTagType.TOXIC_SPIKES, 5, MoveId.TOXIC_SPIKES, 0, 0, ArenaTagSide.ENEMY)!;
    game.scene.arena.tags.push(playerTag);
    game.scene.arena.tags.push(enemyTag);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.SPLASH);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - Both Pokemon gain the poison status effect
     * - The player Pokemon (with Magic Guard) has not taken damage from poison
     * - The enemy Pokemon (without Magic Guard) has taken damage from poison
     */
    expect(leadPokemon.status!.effect).toBe(StatusEffect.POISON);
    expect(enemyPokemon.status!.effect).toBe(StatusEffect.POISON);
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  it("Magic Guard prevents against damage from volatile status effects", async () => {
    await game.classicMode.startBattle([SpeciesId.DUSKULL]);
    game.override.moveset([MoveId.CURSE]).enemyAbility(AbilityId.MAGIC_GUARD);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.CURSE);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) has cut its HP to inflict curse
     * - The enemy Pokemon (with Magic Guard) is cursed
     * - The enemy Pokemon (with Magic Guard) does not lose HP from being cursed
     */
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
    expect(enemyPokemon.getTag(BattlerTagType.CURSED)).not.toBe(undefined);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });

  it("Magic Guard prevents crash damage", async () => {
    game.override.moveset([MoveId.HIGH_JUMP_KICK]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.HIGH_JUMP_KICK);
    await game.move.forceMiss();

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) misses High Jump Kick but does not lose HP as a result
     */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  });

  it("Magic Guard prevents damage from recoil", async () => {
    game.override.moveset([MoveId.TAKE_DOWN]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.TAKE_DOWN);

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) uses a recoil move but does not lose HP from recoil
     */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  });

  it("Magic Guard does not prevent damage from Struggle's recoil", async () => {
    game.override.moveset([MoveId.STRUGGLE]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.STRUGGLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) uses Struggle but does lose HP from Struggle's recoil
     */
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
  });

  //This tests different move attributes than the recoil tests above
  it("Magic Guard prevents self-damage from attacking moves", async () => {
    game.override.moveset([MoveId.STEEL_BEAM]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.STEEL_BEAM);

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) uses a move with an HP cost but does not lose HP from using it
     */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  });

  /*
  it("Magic Guard does not prevent self-damage from confusion", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.CHARM);

    await game.phaseInterceptor.to(TurnEndPhase);
  });
*/

  it("Magic Guard does not prevent self-damage from non-attacking moves", async () => {
    game.override.moveset([MoveId.BELLY_DRUM]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.BELLY_DRUM);

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) uses a non-attacking move with an HP cost and thus loses HP from using it
     */
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
  });

  it("Magic Guard prevents damage from abilities with PostTurnHurtIfSleepingAbAttr", async () => {
    //Tests the ability Bad Dreams
    game.override.statusEffect(StatusEffect.SLEEP);
    //enemy pokemon is given Spore just in case player pokemon somehow awakens during test
    game.override
      .enemyMoveset([MoveId.SPORE, MoveId.SPORE, MoveId.SPORE, MoveId.SPORE])
      .enemyAbility(AbilityId.BAD_DREAMS);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) should not lose HP due to this ability attribute
     * - The player Pokemon is asleep
     */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(leadPokemon.status!.effect).toBe(StatusEffect.SLEEP);
  });

  it("Magic Guard prevents damage from abilities with PostFaintContactDamageAbAttr", async () => {
    //Tests the abilities Innards Out/Aftermath
    game.override.moveset([MoveId.TACKLE]).enemyAbility(AbilityId.AFTERMATH);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    enemyPokemon.hp = 1;

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) should not lose HP due to this ability attribute
     * - The enemy Pokemon has fainted
     */
    expect(enemyPokemon.hp).toBe(0);
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  });

  it("Magic Guard prevents damage from abilities with PostDefendContactDamageAbAttr", async () => {
    //Tests the abilities Iron Barbs/Rough Skin
    game.override.moveset([MoveId.TACKLE]).enemyAbility(AbilityId.IRON_BARBS);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) should not lose HP due to this ability attribute
     * - The player Pokemon's move should have connected
     */
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  });

  it("Magic Guard prevents damage from abilities with ReverseDrainAbAttr", async () => {
    //Tests the ability Liquid Ooze
    game.override.moveset([MoveId.ABSORB]).enemyAbility(AbilityId.LIQUID_OOZE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.ABSORB);
    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) should not lose HP due to this ability attribute
     * - The player Pokemon's move should have connected
     */
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  });

  it("Magic Guard prevents HP loss from abilities with PostWeatherLapseDamageAbAttr", async () => {
    game.override.passiveAbility(AbilityId.SOLAR_POWER).weather(WeatherType.SUNNY);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const leadPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * Expect:
     * - The player Pokemon (with Magic Guard) should not lose HP due to this ability attribute
     */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  });
});
