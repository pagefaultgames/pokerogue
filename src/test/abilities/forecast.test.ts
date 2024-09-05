import { BattlerIndex } from "#app/battle";
import { allAbilities } from "#app/data/ability";
import { Abilities } from "#app/enums/abilities";
import { WeatherType } from "#app/enums/weather-type";
import { DamagePhase } from "#app/phases/damage-phase";
import { MovePhase } from "#app/phases/move-phase";
import { PostSummonPhase } from "#app/phases/post-summon-phase";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
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
   * Tests form changes based on weather changes
   * @param {GameManager} game The game manager instance
   * @param {WeatherType} weather The active weather to set
   * @param form The expected form based on the active weather
   * @param initialForm The initial form pre form change
   */
  const testWeatherFormChange = async (game: GameManager, weather: WeatherType, form: number, initialForm?: number) => {
    game.override.weather(weather).starterForms({ [Species.CASTFORM]: initialForm });
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
      .moveset([Moves.SPLASH, Moves.RAIN_DANCE, Moves.SUNNY_DAY, Moves.TACKLE])
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(SPLASH_ONLY)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("changes form based on weather", async () => {
    game.override
      .moveset([Moves.RAIN_DANCE, Moves.SUNNY_DAY, Moves.SNOWSCAPE, Moves.SPLASH])
      .battleType("double")
      .starterForms({
        [Species.KYOGRE]: 1,
        [Species.GROUDON]: 1,
        [Species.RAYQUAZA]: 1
      });
    await game.startBattle([Species.CASTFORM, Species.FEEBAS, Species.KYOGRE, Species.GROUDON, Species.RAYQUAZA, Species.ALTARIA]);

    vi.spyOn(game.scene.getParty()[5], "getAbility").mockReturnValue(allAbilities[Abilities.CLOUD_NINE]);

    const castform = game.scene.getPlayerField()[0];
    expect(castform.formIndex).toBe(NORMAL_FORM);

    game.move.select(Moves.RAIN_DANCE);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(RAINY_FORM);

    game.move.select(Moves.SUNNY_DAY);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(SUNNY_FORM);

    game.move.select(Moves.SNOWSCAPE);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(SNOWY_FORM);

    game.override.moveset([Moves.HAIL, Moves.SANDSTORM, Moves.SNOWSCAPE, Moves.SPLASH]);

    game.move.select(Moves.SANDSTORM);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(NORMAL_FORM);

    game.move.select(Moves.HAIL);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(SNOWY_FORM);

    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(2); // Feebas now 2, Kyogre 1
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(RAINY_FORM);

    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(3); // Kyogre now 3, Groudon 1
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(SUNNY_FORM);

    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(4); // Groudon now 4, Rayquaza 1
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(NORMAL_FORM);

    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(2); // Rayquaza now 2, Feebas 1
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(NORMAL_FORM);

    game.move.select(Moves.SNOWSCAPE);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(SNOWY_FORM);

    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(5); // Feebas now 5, Altaria 1
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(NORMAL_FORM);

    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(5); // Altaria now 5, Feebas 1
    await game.phaseInterceptor.to("MovePhase");
    await game.toNextTurn();

    expect(castform.formIndex).toBe(SNOWY_FORM);

    game.scene.arena.trySetWeather(WeatherType.FOG, false);
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("TurnStartPhase");

    expect(castform.formIndex).toBe(NORMAL_FORM);
  }, 30 * 1000);

  it("reverts to Normal Form during Clear weather", async () => {
    await testWeatherFormChange(game, WeatherType.NONE, NORMAL_FORM, SUNNY_FORM);
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

  it("reverts to Normal Form when Castform loses Forecast, changes form to match the weather when it regains it", async () => {
    game.override.moveset([Moves.SKILL_SWAP, Moves.WORRY_SEED, Moves.SPLASH]).weather(WeatherType.RAIN).battleType("double");
    await game.startBattle([Species.CASTFORM, Species.FEEBAS]);

    const castform = game.scene.getPlayerField()[0];

    expect(castform.formIndex).toBe(RAINY_FORM);

    game.move.select(Moves.SKILL_SWAP, 0, BattlerIndex.PLAYER_2);
    game.move.select(Moves.SKILL_SWAP, 1, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(castform.formIndex).toBe(NORMAL_FORM);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(castform.formIndex).toBe(RAINY_FORM);

    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.WORRY_SEED, 1, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(castform.formIndex).toBe(NORMAL_FORM);
  });

  it("reverts to Normal Form when Forecast is suppressed, changes form to match the weather when it regains it", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.GASTRO_ACID)).weather(WeatherType.RAIN);
    await game.startBattle([Species.CASTFORM, Species.PIKACHU]);
    const castform = game.scene.getPlayerPokemon()!;

    expect(castform.formIndex).toBe(RAINY_FORM);

    // First turn - Forecast is suppressed
    game.move.select(Moves.SPLASH);
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
    game.override.weather(WeatherType.RAIN).enemyMoveset(Array(4).fill(Moves.STEALTH_ROCK));
    await game.startBattle([Species.PIKACHU, Species.CASTFORM]);

    // First turn - set up stealth rock
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    // Second turn - switch in Castform, regains Forecast
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(PostSummonPhase);

    const castform = game.scene.getPlayerPokemon()!;

    // Damage phase should come first
    await game.phaseInterceptor.to(DamagePhase);
    expect(castform.hp).toBeLessThan(castform.getMaxHp());

    // Then change form
    await game.phaseInterceptor.to(QuietFormChangePhase);
    expect(castform.formIndex).toBe(RAINY_FORM);
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
