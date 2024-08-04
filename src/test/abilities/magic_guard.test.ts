import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import { TurnEndPhase, MoveEffectPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { ArenaTagType } from "#enums/arena-tag-type";
import { ArenaTagSide, getArenaTag } from "#app/data/arena-tag";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { WeatherType } from "#app/data/weather.js";
import { StatusEffect, getStatusEffectCatchRateMultiplier } from "#app/data/status-effect";
import { BattlerTagType } from "#enums/battler-tag-type";

const TIMEOUT = 20 * 1000; // 20 sec timeout

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

    /** Player Pokemon overrides */
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MAGIC_GUARD);
    vi.spyOn(overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.UNNERVE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);

    /** Enemy Pokemon overrides */
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Magic_Guard_(Ability)

  it(
    "ability should prevent damage caused by weather",
    async () => {
      vi.spyOn(overrides, "WEATHER_OVERRIDE", "get").mockReturnValue(WeatherType.SANDSTORM);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      /**
       * Expect:
       * - The player Pokemon (with Magic Guard) has not taken damage from weather
       * - The enemy Pokemon (without Magic Guard) has taken damage from weather
       */
      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "ability should prevent damage caused by status effects but other non-damage effects still apply",
    async () => {
      //Toxic keeps track of the turn counters -> important that Magic Guard keeps track of post-Toxic turns
      vi.spyOn(overrides, "STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.POISON);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      /**
       * Expect:
       * - The player Pokemon (with Magic Guard) has not taken damage from poison
       * - The Pokemon's CatchRateMultiplier should be 1.5
       */
      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(getStatusEffectCatchRateMultiplier(leadPokemon.status.effect)).toBe(1.5);
    }, TIMEOUT
  );

  it(
    "ability effect should not persist when the ability is replaced",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WORRY_SEED,Moves.WORRY_SEED,Moves.WORRY_SEED,Moves.WORRY_SEED]);
      vi.spyOn(overrides, "STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.POISON);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      /**
       * Expect:
       * - The player Pokemon (that just lost its Magic Guard ability) has taken damage from poison
       */
      expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
    }, TIMEOUT
  );


  it("Magic Guard prevents damage caused by burn but other non-damaging effects are still applied",
    async () => {
      vi.spyOn(overrides, "OPP_STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.BURN);
      vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MAGIC_GUARD);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect (leadPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      await game.phaseInterceptor.to(TurnEndPhase);

      /**
       * Expect:
       * - The enemy Pokemon (with Magic Guard) has not taken damage from burn
       * - The enemy Pokemon's physical attack damage is halved (TBD)
       * - The enemy Pokemon's hypothetical CatchRateMultiplier should be 1.5
       */
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
      expect(getStatusEffectCatchRateMultiplier(enemyPokemon.status.effect)).toBe(1.5);
    }, TIMEOUT
  );

  it("Magic Guard prevents damage caused by toxic but other non-damaging effects are still applied",
    async () => {
      vi.spyOn(overrides, "OPP_STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.TOXIC);
      vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MAGIC_GUARD);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect (leadPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      const toxicStartCounter = enemyPokemon.status.turnCount;
      //should be 0

      await game.phaseInterceptor.to(TurnEndPhase);

      /**
       * Expect:
       * - The enemy Pokemon (with Magic Guard) has not taken damage from toxic
       * - The enemy Pokemon's status effect duration should be incremented
       * - The enemy Pokemon's hypothetical CatchRateMultiplier should be 1.5
       */
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
      expect(enemyPokemon.status.turnCount).toBeGreaterThan(toxicStartCounter);
      expect(getStatusEffectCatchRateMultiplier(enemyPokemon.status.effect)).toBe(1.5);
    }, TIMEOUT
  );


  it("Magic Guard prevents damage caused by entry hazards", async () => {
    //Adds and applies Spikes to both sides of the arena
    const newTag = getArenaTag(ArenaTagType.SPIKES, 5, Moves.SPIKES, 0, 0, ArenaTagSide.BOTH);
    game.scene.arena.tags.push(newTag);

    await game.startBattle([Species.MAGIKARP]);
    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) has not taken damage from spikes
    * - The enemy Pokemon (without Magic Guard) has taken damage from spikes
    */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  }, TIMEOUT
  );

  it("Magic Guard does not prevent poison from Toxic Spikes", async () => {
    //Adds and applies Spikes to both sides of the arena
    const playerTag = getArenaTag(ArenaTagType.TOXIC_SPIKES, 5, Moves.TOXIC_SPIKES, 0, 0, ArenaTagSide.PLAYER);
    const enemyTag = getArenaTag(ArenaTagType.TOXIC_SPIKES, 5, Moves.TOXIC_SPIKES, 0, 0, ArenaTagSide.ENEMY);
    game.scene.arena.tags.push(playerTag);
    game.scene.arena.tags.push(enemyTag);

    await game.startBattle([Species.MAGIKARP]);
    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - Both Pokemon gain the poison status effect
    * - The player Pokemon (with Magic Guard) has not taken damage from poison
    * - The enemy Pokemon (without Magic Guard) has taken damage from poison
    */
    expect(leadPokemon.status.effect).toBe(StatusEffect.POISON);
    expect(enemyPokemon.status.effect).toBe(StatusEffect.POISON);
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  }, TIMEOUT
  );

  it("Magic Guard prevents against damage from volatile status effects",
    async () => {
      await game.startBattle([Species.DUSKULL]);
      vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.CURSE]);
      vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MAGIC_GUARD);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect (leadPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.CURSE));

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

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
    }, TIMEOUT
  );

  it("Magic Guard prevents crash damage", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.HIGH_JUMP_KICK]);
    await game.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.HIGH_JUMP_KICK));
    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValueOnce(false);

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) misses High Jump Kick but does not lose HP as a result
    */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  }, TIMEOUT
  );

  it("Magic Guard prevents damage from recoil", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TAKE_DOWN]);
    await game.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAKE_DOWN));

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) uses a recoil move but does not lose HP from recoil
    */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  }, TIMEOUT
  );

  it("Magic Guard does not prevent damage from Struggle's recoil", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.STRUGGLE]);
    await game.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.STRUGGLE));

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) uses Struggle but does lose HP from Struggle's recoil
    */
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
  }, TIMEOUT
  );

  //This tests different move attributes than the recoil tests above
  it("Magic Guard prevents self-damage from attacking moves", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.STEEL_BEAM]);
    await game.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.STEEL_BEAM));

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) uses a move with an HP cost but does not lose HP from using it
    */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  }, TIMEOUT
  );

  /*
  it("Magic Guard does not prevent self-damage from confusion", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });
*/

  it("Magic Guard does not prevent self-damage from non-attacking moves", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.BELLY_DRUM]);
    await game.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.BELLY_DRUM));

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) uses a non-attacking move with an HP cost and thus loses HP from using it
    */
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
  }, TIMEOUT
  );

  it("Magic Guard prevents damage from abilities with PostTurnHurtIfSleepingAbAttr", async() => {
    //Tests the ability Bad Dreams
    vi.spyOn(overrides, "STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.SLEEP);
    //enemy pokemon is given Spore just in case player pokemon somehow awakens during test
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPORE, Moves.SPORE, Moves.SPORE, Moves.SPORE]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BAD_DREAMS);

    await game.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) should not lose HP due to this ability attribute
    * - The player Pokemon is asleep
    */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(leadPokemon.status.effect).toBe(StatusEffect.SLEEP);
  }, TIMEOUT
  );

  it("Magic Guard prevents damage from abilities with PostFaintContactDamageAbAttr", async() => {
    //Tests the abilities Innards Out/Aftermath
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.AFTERMATH);

    await game.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();
    enemyPokemon.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) should not lose HP due to this ability attribute
    * - The enemy Pokemon has fainted
    */
    expect(enemyPokemon.hp).toBe(0);
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  }, TIMEOUT
  );

  it("Magic Guard prevents damage from abilities with PostDefendContactDamageAbAttr", async() => {
    //Tests the abilities Iron Barbs/Rough Skin
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.IRON_BARBS);

    await game.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) should not lose HP due to this ability attribute
    * - The player Pokemon's move should have connected
    */
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  }, TIMEOUT
  );

  it("Magic Guard prevents damage from abilities with ReverseDrainAbAttr", async() => {
    //Tests the ability Liquid Ooze
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.ABSORB]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.LIQUID_OOZE);

    await game.startBattle([Species.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.ABSORB));
    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) should not lose HP due to this ability attribute
    * - The player Pokemon's move should have connected
    */
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  }, TIMEOUT
  );

  it("Magic Guard prevents HP loss from abilities with PostWeatherLapseDamageAbAttr", async() => {
    //Tests the abilities Solar Power/Dry Skin
    vi.spyOn(overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SOLAR_POWER);
    vi.spyOn(overrides, "WEATHER_OVERRIDE", "get").mockReturnValue(WeatherType.SUNNY);

    await game.startBattle([Species.MAGIKARP]);
    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);

    /**
    * Expect:
    * - The player Pokemon (with Magic Guard) should not lose HP due to this ability attribute
    */
    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  }, TIMEOUT
  );
});
