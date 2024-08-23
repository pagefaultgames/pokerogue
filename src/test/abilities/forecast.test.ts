import { Abilities } from "#app/enums/abilities.js";
import GameManager from "#test/utils/gameManager";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import { WeatherType } from "#app/enums/weather-type";
import { BattlerIndex } from "#app/battle";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { DamagePhase } from "#app/phases/damage-phase";
import { MovePhase } from "#app/phases/move-phase";
import { PostSummonPhase } from "#app/phases/post-summon-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { VictoryPhase } from "#app/phases/victory-phase";
import { allAbilities } from "#app/data/ability";

describe("Abilities - Forecast", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const NORMAL_FORM = 0;
  const SUNNY_FORM = 1;
  const RAINY_FORM = 2;
  const SNOWY_FORM = 3;

  /**
   * Tests form changes based on weather changes
   * @param {GameManager} game The game manager instance
   * @param {WeatherType} weather The active weather to set
   * @param form The expected form based on the active weather
   * @param initialForm The initial form pre form change
   */
  const testWeatherFormChange = async (game: GameManager, weather: WeatherType, form: number, initialForm?: number) => {
    game.override.weather(weather).starterForms({[Species.CASTFORM]: initialForm});
    await game.startBattle([Species.CASTFORM]);

    game.move.select(Moves.SPLASH);

    expect(game.scene.getPlayerPokemon()?.formIndex).toBe(form);
  };

  /**
   * Tests reverting to normal form when Cloud Nine/Air Lock is active on the field
   * @param {GameManager} game The game manager instance
   * @param {Abilities} ability The ability that is active on the field
   */
  const testRevertFormAgainstAbility = async (game: GameManager, ability: Abilities) => {
    game.override.starterForms({ [Species.CASTFORM]: SUNNY_FORM }).enemyAbility(ability);
    await game.startBattle([Species.CASTFORM]);

    game.move.select(Moves.SPLASH);

    expect(game.scene.getPlayerPokemon()?.formIndex).toBe(NORMAL_FORM);
  };

  /**
   * Tests transforming back to match the weather when Cloud Nine/Air Lock user is fainted
   * @param {GameManager} game The game manager instance
   * @param {Abilities} ability The ability that will go out of battle (faint)
   */
  const testTransformAfterAbilityFaint = async (game: GameManager, ability: Abilities) => {
    game.override.enemyAbility(ability).weather(WeatherType.SNOW).enemySpecies(Species.SHUCKLE);
    await game.startBattle([Species.CASTFORM]);
    const castform = game.scene.getPlayerPokemon();

    expect(castform?.formIndex).toBe(NORMAL_FORM);

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to(DamagePhase);

    await game.doKillOpponents();
    await game.phaseInterceptor.to(VictoryPhase);

    expect(castform?.formIndex).toBe(SNOWY_FORM);
  };

  /**
   * Tests transforming back to match the weather when Cloud Nine/Air Lock user is switched out
   * @param {GameManager} game The game manager instance
   * @param {Abilities} ability The ability that will go out of battle (switched out)
   */
  const testTransformAfterAbilitySwitchOut = async (game: GameManager, ability: Abilities) => {
    game.override
      .weather(WeatherType.SNOW)
      .enemySpecies(Species.CASTFORM)
      .enemyAbility(Abilities.FORECAST)
      .ability(ability);
    await game.startBattle([Species.PICHU, Species.PIKACHU]);

    const castform = game.scene.getEnemyPokemon();

    // We mock the return value of the second Pokemon to be other than Air Lock/Cloud Nine
    vi.spyOn(game.scene.getParty()[1]!, "getAbility").mockReturnValue(allAbilities[Abilities.BALL_FETCH]);
    expect(game.scene.getParty()[1]?.hasAbility(Abilities.BALL_FETCH));

    expect(castform?.formIndex).toBe(NORMAL_FORM);

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(MovePhase);
    expect(castform?.formIndex).toBe(SNOWY_FORM);
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
    game.override.moveset([ Moves.SPLASH, Moves.RAIN_DANCE, Moves.SUNNY_DAY, Moves.TACKLE ])
      .enemyMoveset(SPLASH_ONLY)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("changes to Sunny Form during Harsh Sunlight", async () => {
    await testWeatherFormChange(game, WeatherType.SUNNY, SUNNY_FORM);
  });

  it("changes to Sunny Form during Extreme Harsh Sunlight", async () => {
    await testWeatherFormChange(game, WeatherType.HARSH_SUN, SUNNY_FORM);
  });

  it("changes to Rainy Form during Rain", async () => {
    await testWeatherFormChange(game, WeatherType.RAIN, RAINY_FORM);
  });

  it("changes to Rainy Form during Heavy Rain", async () => {
    await testWeatherFormChange(game, WeatherType.HEAVY_RAIN, RAINY_FORM);
  });

  it("changes to Snowy Form during Hail", async () => {
    await testWeatherFormChange(game, WeatherType.HAIL, SNOWY_FORM);
  });

  it("changes to Snowy Form during Snow", async () => {
    await testWeatherFormChange(game, WeatherType.SNOW, SNOWY_FORM);
  });

  it("reverts to Normal Form during Sandstorm", async () => {
    await testWeatherFormChange(game, WeatherType.SANDSTORM, NORMAL_FORM, SUNNY_FORM);
  });

  it("reverts to Normal Form during Fog", async () => {
    await testWeatherFormChange(game, WeatherType.FOG, NORMAL_FORM, SUNNY_FORM);
  });

  it("reverts to Normal Form during Strong Winds", async () => {
    await testWeatherFormChange(game, WeatherType.STRONG_WINDS, NORMAL_FORM, SUNNY_FORM);
  });

  it("reverts to Normal Form during Clear weather", async () => {
    await testWeatherFormChange(game, WeatherType.NONE, NORMAL_FORM, SUNNY_FORM);
  });

  it("reverts to Normal Form if a Pokémon on the field has Cloud Nine", async () => {
    await testRevertFormAgainstAbility(game, Abilities.CLOUD_NINE);
  });

  it("reverts to Normal Form if a Pokémon on the field has Air Lock", async () => {
    await testRevertFormAgainstAbility(game, Abilities.AIR_LOCK);
  });

  it("has no effect on Pokémon other than Castform", async () => {
    game.override.enemyAbility(Abilities.FORECAST).enemySpecies(Species.SHUCKLE);
    await game.startBattle([Species.CASTFORM]);

    game.move.select(Moves.RAIN_DANCE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()?.formIndex).toBe(RAINY_FORM);
    expect(game.scene.getEnemyPokemon()?.formIndex).not.toBe(RAINY_FORM);
  });

  it("cannot be copied", async () => {
    game.override.enemyAbility(Abilities.TRACE);
    await game.startBattle([Species.CASTFORM]);

    game.move.select(Moves.SPLASH);

    expect(game.scene.getEnemyPokemon()?.hasAbility(Abilities.FORECAST)).toBe(false);
  });

  it("(Skill Swap) reverts to Normal Form when Castform loses Forecast, changes form to match the weather when it regains it", async () => {
    game.override.moveset([Moves.SKILL_SWAP]).weather(WeatherType.RAIN);
    await game.startBattle([Species.CASTFORM]);
    const castform = game.scene.getPlayerPokemon();

    expect(castform?.formIndex).toBe(RAINY_FORM);

    // First turn - loses Forecast
    game.move.select(Moves.SKILL_SWAP);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(castform?.formIndex).toBe(NORMAL_FORM);

    // Second turn - regains Forecast
    game.move.select(Moves.SKILL_SWAP);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(castform?.formIndex).toBe(RAINY_FORM);
  });

  it("(Worry Seed) reverts to Normal Form when Castform loses Forecast, changes form to match the weather when it regains it", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.WORRY_SEED)).weather(WeatherType.RAIN);
    await game.startBattle([Species.CASTFORM, Species.PIKACHU]);
    const castform = game.scene.getPlayerPokemon();

    expect(castform?.formIndex).toBe(RAINY_FORM);

    // First turn - loses Forecast
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(castform?.formIndex).toBe(NORMAL_FORM);

    await game.toNextTurn();

    // Second turn - switch out Castform, regains Forecast
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    // Third turn - switch in Castform
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(MovePhase);

    expect(castform?.formIndex).toBe(RAINY_FORM);
  });

  it("reverts to Normal Form when active weather ends", async () => {
    await game.startBattle([Species.CASTFORM]);
    const castform = game.scene.getPlayerPokemon();

    game.move.select(Moves.SUNNY_DAY);
    await game.phaseInterceptor.to(TurnEndPhase);

    while (game.scene.arena.weather && game.scene.arena.weather.turnsLeft > 0) {
      game.move.select(Moves.SPLASH);
      expect(castform?.formIndex).toBe(SUNNY_FORM);
      await game.toNextTurn();
    }

    expect(castform?.formIndex).toBe(NORMAL_FORM);
  });

  it("reverts to Normal Form when Forecast is suppressed, changes form to match the weather when it regains it", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.GASTRO_ACID)).weather(WeatherType.RAIN);
    await game.startBattle([Species.CASTFORM, Species.PIKACHU]);
    const castform = game.scene.getPlayerPokemon();

    expect(castform?.formIndex).toBe(RAINY_FORM);

    // First turn - Forecast is suppressed
    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.move.forceHit();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(castform?.summonData.abilitySuppressed).toBe(true);
    expect(castform?.formIndex).toBe(NORMAL_FORM);

    await game.toNextTurn();

    // Second turn - switch out Castform, regains Forecast
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    // Third turn - switch in Castform
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(MovePhase);

    expect(castform?.summonData.abilitySuppressed).toBe(false);
    expect(castform?.formIndex).toBe(RAINY_FORM);
  });

  it("if a Pokémon transforms into Castform, the Pokémon will remain in the same form as the target Castform, regardless of the weather", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.TRANSFORM));
    await game.startBattle([Species.CASTFORM]);

    game.move.select(Moves.SUNNY_DAY);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()?.formIndex).toBe(SUNNY_FORM);
    expect(game.scene.getEnemyPokemon()?.formIndex).toBe(NORMAL_FORM);
  });

  it("does not change Castform's form until after Stealth Rock deals damage", async () => {
    game.override.weather(WeatherType.RAIN).enemyMoveset(Array(4).fill(Moves.STEALTH_ROCK));
    await game.startBattle([Species.PIKACHU, Species.CASTFORM]);

    // First turn - set up stealth rock
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    // Second turn - switch in Castform, regains Forecast
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(PostSummonPhase);

    const castform = game.scene.getPlayerPokemon();

    // Damage phase should come first
    await game.phaseInterceptor.to(DamagePhase);
    expect(castform?.hp).toBeLessThan(castform?.getMaxHp() ?? 0);

    // Then change form
    await game.phaseInterceptor.to(QuietFormChangePhase);
    expect(castform?.formIndex).toBe(RAINY_FORM);
  });

  it("transforms to weather-based form when Pokemon with Air Lock is fainted", async () => {
    await testTransformAfterAbilityFaint(game, Abilities.AIR_LOCK);
  });

  it("transforms to weather-based form when Pokemon with Cloud Nine is fainted", async () => {
    await testTransformAfterAbilityFaint(game, Abilities.CLOUD_NINE);
  });

  it("transforms to weather-based form when Pokemon with Air Lock is switched out", async () => {
    await testTransformAfterAbilitySwitchOut(game, Abilities.AIR_LOCK);
  });

  it("transforms to weather-based form when Pokemon with Cloud Nine is switched out", async () => {
    await testTransformAfterAbilitySwitchOut(game, Abilities.CLOUD_NINE);
  });

  it("should be in Normal Form after the user is switched out", async () => {
    game.override.weather(WeatherType.RAIN);

    await game.startBattle([Species.CASTFORM, Species.MAGIKARP]);
    const castform = game.scene.getPlayerPokemon()!;

    expect(castform.formIndex).toBe(RAINY_FORM);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(castform.formIndex).toBe(NORMAL_FORM);
  });
});
