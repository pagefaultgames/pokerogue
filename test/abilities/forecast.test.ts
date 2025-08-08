import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { DamageAnimPhase } from "#phases/damage-anim-phase";
import { MovePhase } from "#phases/move-phase";
import { PostSummonPhase } from "#phases/post-summon-phase";
import { QuietFormChangePhase } from "#phases/quiet-form-change-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Forecast", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const NORMAL_FORM = 0;
  const SUNNY_FORM = 1;
  const RAINY_FORM = 2;
  const SNOWY_FORM = 3;

  /**
   * Tests reverting to normal form when Cloud Nine/Air Lock is active on the field
   * @param game - The game manager instance
   * @param ability - The ability that is active on the field
   */
  const testRevertFormAgainstAbility = async (game: GameManager, ability: AbilityId) => {
    game.override.starterForms({ [SpeciesId.CASTFORM]: SUNNY_FORM }).enemyAbility(ability);
    await game.classicMode.startBattle([SpeciesId.CASTFORM]);

    game.move.select(MoveId.SPLASH);

    expect(game.field.getPlayerPokemon().formIndex).toBe(NORMAL_FORM);
  };

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
      .moveset([MoveId.SPLASH, MoveId.RAIN_DANCE, MoveId.SUNNY_DAY, MoveId.TACKLE])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it(
    "changes form based on weather",
    async () => {
      game.override
        .moveset([MoveId.RAIN_DANCE, MoveId.SUNNY_DAY, MoveId.SNOWSCAPE, MoveId.SPLASH])
        .battleStyle("double")
        .starterForms({
          [SpeciesId.KYOGRE]: 1,
          [SpeciesId.GROUDON]: 1,
          [SpeciesId.RAYQUAZA]: 1,
        });
      await game.classicMode.startBattle([
        SpeciesId.CASTFORM,
        SpeciesId.FEEBAS,
        SpeciesId.KYOGRE,
        SpeciesId.GROUDON,
        SpeciesId.RAYQUAZA,
        SpeciesId.ALTARIA,
      ]);

      vi.spyOn(game.scene.getPlayerParty()[5], "getAbility").mockReturnValue(allAbilities[AbilityId.CLOUD_NINE]);

      const castform = game.scene.getPlayerField()[0];
      expect(castform.formIndex).toBe(NORMAL_FORM);

      game.move.select(MoveId.RAIN_DANCE);
      game.move.select(MoveId.SPLASH, 1);
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(RAINY_FORM);

      game.move.select(MoveId.SUNNY_DAY);
      game.move.select(MoveId.SPLASH, 1);
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(SUNNY_FORM);

      game.move.select(MoveId.SNOWSCAPE);
      game.move.select(MoveId.SPLASH, 1);
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(SNOWY_FORM);

      game.override.moveset([MoveId.HAIL, MoveId.SANDSTORM, MoveId.SNOWSCAPE, MoveId.SPLASH]);

      game.move.select(MoveId.SANDSTORM);
      game.move.select(MoveId.SPLASH, 1);
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(NORMAL_FORM);

      game.move.select(MoveId.HAIL);
      game.move.select(MoveId.SPLASH, 1);
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(SNOWY_FORM);

      game.move.select(MoveId.SPLASH);
      game.doSwitchPokemon(2); // Feebas now 2, Kyogre 1
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(RAINY_FORM);

      game.move.select(MoveId.SPLASH);
      game.doSwitchPokemon(3); // Kyogre now 3, Groudon 1
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(SUNNY_FORM);

      game.move.select(MoveId.SPLASH);
      game.doSwitchPokemon(4); // Groudon now 4, Rayquaza 1
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(NORMAL_FORM);

      game.move.select(MoveId.SPLASH);
      game.doSwitchPokemon(2); // Rayquaza now 2, Feebas 1
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(NORMAL_FORM);

      game.move.select(MoveId.SNOWSCAPE);
      game.move.select(MoveId.SPLASH, 1);
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(SNOWY_FORM);

      game.move.select(MoveId.SPLASH);
      game.doSwitchPokemon(5); // Feebas now 5, Altaria 1
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(NORMAL_FORM);

      game.move.select(MoveId.SPLASH);
      game.doSwitchPokemon(5); // Altaria now 5, Feebas 1
      await game.phaseInterceptor.to("MovePhase");
      await game.toNextTurn();

      expect(castform.formIndex).toBe(SNOWY_FORM);

      game.scene.arena.trySetWeather(WeatherType.FOG);
      game.move.select(MoveId.SPLASH);
      game.move.select(MoveId.SPLASH, 1);
      await game.phaseInterceptor.to("TurnStartPhase");

      expect(castform.formIndex).toBe(NORMAL_FORM);
    },
    30 * 1000,
  );

  it("reverts to Normal Form if a Pokémon on the field has Air Lock", async () => {
    await testRevertFormAgainstAbility(game, AbilityId.AIR_LOCK);
  });

  it("has no effect on Pokémon other than Castform", async () => {
    game.override.enemyAbility(AbilityId.FORECAST).enemySpecies(SpeciesId.SHUCKLE);
    await game.classicMode.startBattle([SpeciesId.CASTFORM]);

    game.move.select(MoveId.RAIN_DANCE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.field.getPlayerPokemon().formIndex).toBe(RAINY_FORM);
    expect(game.field.getEnemyPokemon().formIndex).not.toBe(RAINY_FORM);
  });

  it("reverts to Normal Form when Forecast is suppressed, changes form to match the weather when it regains it", async () => {
    game.override.enemyMoveset([MoveId.GASTRO_ACID]).weather(WeatherType.RAIN);
    await game.classicMode.startBattle([SpeciesId.CASTFORM, SpeciesId.PIKACHU]);
    const castform = game.field.getPlayerPokemon();

    expect(castform.formIndex).toBe(RAINY_FORM);

    // First turn - Forecast is suppressed
    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.move.forceHit();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(castform.summonData.abilitySuppressed).toBe(true);
    expect(castform.formIndex).toBe(NORMAL_FORM);

    await game.toNextTurn();

    // Second turn - switch out Castform, regains Forecast
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    // Third turn - switch in Castform
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(MovePhase);

    expect(castform.summonData.abilitySuppressed).toBe(false);
    expect(castform.formIndex).toBe(RAINY_FORM);
  });

  it("does not change Castform's form until after Stealth Rock deals damage", async () => {
    game.override.weather(WeatherType.RAIN).enemyMoveset([MoveId.STEALTH_ROCK]);
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.CASTFORM]);

    // First turn - set up stealth rock
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    // Second turn - switch in Castform, regains Forecast
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(PostSummonPhase);

    const castform = game.field.getPlayerPokemon();

    // Damage phase should come first
    await game.phaseInterceptor.to(DamageAnimPhase);
    expect(castform.hp).toBeLessThan(castform.getMaxHp());

    // Then change form
    await game.phaseInterceptor.to(QuietFormChangePhase);
    expect(castform.formIndex).toBe(RAINY_FORM);
  });

  it("should be in Normal Form after the user is switched out", async () => {
    game.override.weather(WeatherType.RAIN);

    await game.classicMode.startBattle([SpeciesId.CASTFORM, SpeciesId.MAGIKARP]);
    const castform = game.field.getPlayerPokemon();

    expect(castform.formIndex).toBe(RAINY_FORM);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(castform.formIndex).toBe(NORMAL_FORM);
  });

  // NOTE: The following pairs of tests are intentionally testing the same scenario, switching the player and enemy pokemon
  // as this is a regression test where the order of player and enemy mattered.
  it("should trigger player's form change when summoned at the same time as an enemy with a weather changing ability", async () => {
    game.override.enemyAbility(AbilityId.DROUGHT);
    await game.classicMode.startBattle([SpeciesId.CASTFORM, SpeciesId.MAGIKARP]);
    const castform = game.field.getPlayerPokemon();
    expect(castform.formIndex).toBe(SUNNY_FORM);
  });

  it("should trigger enemy's form change when summoned at the same time as a player with a weather changing ability", async () => {
    game.override.ability(AbilityId.DROUGHT).enemySpecies(SpeciesId.CASTFORM).enemyAbility(AbilityId.FORECAST);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const castform = game.field.getEnemyPokemon();
    expect(castform.formIndex).toBe(SUNNY_FORM);
  });
});
