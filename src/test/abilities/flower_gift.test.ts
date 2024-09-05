import { BattlerIndex } from "#app/battle";
import { Abilities } from "#app/enums/abilities";
import { Stat } from "#app/enums/stat";
import { WeatherType } from "#app/enums/weather-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Flower Gift", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const OVERCAST_FORM = 0;
  const SUNSHINE_FORM = 1;

  /**
   * Tests reverting to normal form when Cloud Nine/Air Lock is active on the field
   * @param {GameManager} game The game manager instance
   * @param {Abilities} ability The ability that is active on the field
   */
  const testRevertFormAgainstAbility = async (game: GameManager, ability: Abilities) => {
    game.override.starterForms({ [Species.CASTFORM]: SUNSHINE_FORM }).enemyAbility(ability);
    await game.classicMode.startBattle([Species.CASTFORM]);

    game.move.select(Moves.SPLASH);

    expect(game.scene.getPlayerPokemon()?.formIndex).toBe(OVERCAST_FORM);
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
      .moveset([Moves.SPLASH, Moves.RAIN_DANCE, Moves.SUNNY_DAY, Moves.SKILL_SWAP])
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(SPLASH_ONLY)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  // TODO: Uncomment expect statements when the ability is implemented - currently does not increase stats of allies
  it("increases the ATK and SPDEF stat stages of the Pokémon with this Ability and its allies by 1.5× during Harsh Sunlight", async () => {
    game.override.battleType("double");
    await game.classicMode.startBattle([Species.CHERRIM, Species.MAGIKARP]);

    const [ cherrim ] = game.scene.getPlayerField();
    const cherrimAtkStat = cherrim.getEffectiveStat(Stat.ATK);
    const cherrimSpDefStat = cherrim.getEffectiveStat(Stat.SPDEF);

    // const magikarpAtkStat = magikarp.getEffectiveStat(Stat.ATK);;
    // const magikarpSpDefStat = magikarp.getEffectiveStat(Stat.SPDEF);

    game.move.select(Moves.SUNNY_DAY, 0);
    game.move.select(Moves.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);
    expect(cherrim.getEffectiveStat(Stat.ATK)).toBe(Math.floor(cherrimAtkStat * 1.5));
    expect(cherrim.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(cherrimSpDefStat * 1.5));
    // expect(magikarp.getEffectiveStat(Stat.ATK)).toBe(Math.floor(magikarpAtkStat * 1.5));
    // expect(magikarp.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(magikarpSpDefStat * 1.5));
  });

  it("changes the Pokemon's form during Harsh Sunlight", async () => {
    game.override.weather(WeatherType.HARSH_SUN);
    await game.classicMode.startBattle([Species.CHERRIM]);

    const cherrim = game.scene.getPlayerPokemon()!;
    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);

    game.move.select(Moves.SPLASH);
  });

  it("reverts to Overcast Form if a Pokémon on the field has Air Lock", async () => {
    await testRevertFormAgainstAbility(game, Abilities.AIR_LOCK);
  });

  it("reverts to Overcast Form if a Pokémon on the field has Cloud Nine", async () => {
    await testRevertFormAgainstAbility(game, Abilities.CLOUD_NINE);
  });

  it("reverts to Overcast Form when the Pokémon loses Flower Gift, changes form under Harsh Sunlight/Sunny when it regains it", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.SKILL_SWAP)).weather(WeatherType.HARSH_SUN);

    await game.classicMode.startBattle([Species.CHERRIM]);

    const cherrim = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SKILL_SWAP);

    await game.phaseInterceptor.to("TurnStartPhase");
    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(cherrim.formIndex).toBe(OVERCAST_FORM);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);
  });

  it("reverts to Overcast Form when the Flower Gift is suppressed, changes form under Harsh Sunlight/Sunny when it regains it", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.GASTRO_ACID)).weather(WeatherType.HARSH_SUN);

    await game.classicMode.startBattle([Species.CHERRIM, Species.MAGIKARP]);

    const cherrim = game.scene.getPlayerPokemon()!;

    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);

    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(cherrim.summonData.abilitySuppressed).toBe(true);
    expect(cherrim.formIndex).toBe(OVERCAST_FORM);

    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("MovePhase");

    expect(cherrim.summonData.abilitySuppressed).toBe(false);
    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);
  });

  it("should be in Overcast Form after the user is switched out", async () => {
    game.override.weather(WeatherType.SUNNY);

    await game.classicMode.startBattle([Species.CASTFORM, Species.MAGIKARP]);
    const cherrim = game.scene.getPlayerPokemon()!;

    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(cherrim.formIndex).toBe(OVERCAST_FORM);
  });
});
