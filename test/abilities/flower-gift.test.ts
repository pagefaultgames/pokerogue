import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { WeatherType } from "#enums/weather-type";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Flower Gift", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const OVERCAST_FORM = 0;
  const SUNSHINE_FORM = 1;

  /**
   * Tests reverting to normal form when Cloud Nine/Air Lock is active on the field
   * @param {GameManager} game The game manager instance
   * @param {AbilityId} ability The ability that is active on the field
   */
  const testRevertFormAgainstAbility = async (game: GameManager, ability: AbilityId) => {
    game.override.starterForms({ [SpeciesId.CASTFORM]: SUNSHINE_FORM }).enemyAbility(ability);
    await game.classicMode.startBattle([SpeciesId.CASTFORM]);

    game.move.select(MoveId.SPLASH);

    expect(game.field.getPlayerPokemon().formIndex).toBe(OVERCAST_FORM);
  };

  /**
   * Tests damage dealt by a move used against a target before and after Flower Gift is activated.
   * @param game The game manager instance
   * @param move The move that should be used
   * @param allyAttacker True if the ally is attacking the enemy, false if the enemy is attacking the ally
   * @param ability The ability that the ally pokemon should have
   * @param enemyAbility The ability that the enemy pokemon should have
   *
   * @returns Two numbers, the first being the damage done to the target without flower gift active, the second being the damage done with flower gift active
   */
  const testDamageDealt = async (
    game: GameManager,
    move: MoveId,
    allyAttacker: boolean,
    allyAbility = AbilityId.BALL_FETCH,
    enemyAbility = AbilityId.BALL_FETCH,
  ): Promise<[number, number]> => {
    game.override
      .battleStyle("double")
      .moveset([MoveId.SPLASH, MoveId.SUNNY_DAY, move, MoveId.HEAL_PULSE])
      .enemyMoveset([MoveId.SPLASH, MoveId.HEAL_PULSE]);
    const target_index = allyAttacker ? BattlerIndex.ENEMY : BattlerIndex.PLAYER_2;
    const attacker_index = allyAttacker ? BattlerIndex.PLAYER_2 : BattlerIndex.ENEMY;
    const ally_move = allyAttacker ? move : MoveId.SPLASH;
    const enemy_move = allyAttacker ? MoveId.SPLASH : move;
    const ally_target = allyAttacker ? BattlerIndex.ENEMY : null;

    await game.classicMode.startBattle([SpeciesId.CHERRIM, SpeciesId.MAGIKARP]);
    const target = allyAttacker ? game.scene.getEnemyField()[0] : game.scene.getPlayerField()[1];
    const initialHp = target.getMaxHp();

    // Override the ability for the target and attacker only
    vi.spyOn(game.scene.getPlayerField()[1], "getAbility").mockReturnValue(allAbilities[allyAbility]);
    vi.spyOn(game.scene.getEnemyField()[0], "getAbility").mockReturnValue(allAbilities[enemyAbility]);

    // turn 1
    game.move.select(MoveId.SUNNY_DAY, 0);
    game.move.select(ally_move, 1, ally_target);
    await game.move.selectEnemyMove(enemy_move, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    // Ensure sunny day is used last.
    await game.setTurnOrder([attacker_index, target_index, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to(TurnEndPhase);
    const damageWithoutGift = initialHp - target.hp;

    target.hp = initialHp;

    // turn 2. Make target use recover to reset hp calculation.
    game.move.select(MoveId.SPLASH, 0, target_index);
    game.move.select(ally_move, 1, ally_target);
    await game.move.selectEnemyMove(enemy_move, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, target_index, attacker_index]);
    await game.phaseInterceptor.to(TurnEndPhase);
    const damageWithGift = initialHp - target.hp;

    return [damageWithoutGift, damageWithGift];
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
      .moveset([MoveId.SPLASH, MoveId.SUNSTEEL_STRIKE, MoveId.SUNNY_DAY, MoveId.MUD_SLAP])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyLevel(100)
      .startingLevel(100);
  });

  it("increases the ATK and SPDEF stat stages of the Pokémon with this Ability and its allies by 1.5× during Harsh Sunlight", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.CHERRIM, SpeciesId.MAGIKARP]);

    const [cherrim, magikarp] = game.scene.getPlayerField();
    const cherrimAtkStat = cherrim.getEffectiveStat(Stat.ATK);
    const cherrimSpDefStat = cherrim.getEffectiveStat(Stat.SPDEF);

    const magikarpAtkStat = magikarp.getEffectiveStat(Stat.ATK);
    const magikarpSpDefStat = magikarp.getEffectiveStat(Stat.SPDEF);

    game.move.select(MoveId.SUNNY_DAY, 0);
    game.move.select(MoveId.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);
    expect(cherrim.getEffectiveStat(Stat.ATK)).toBe(Math.floor(cherrimAtkStat * 1.5));
    expect(cherrim.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(cherrimSpDefStat * 1.5));
    expect(magikarp.getEffectiveStat(Stat.ATK)).toBe(Math.floor(magikarpAtkStat * 1.5));
    expect(magikarp.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(magikarpSpDefStat * 1.5));
  });

  it("should not increase the damage of an ally using an ability ignoring move", async () => {
    const [damageWithGift, damageWithoutGift] = await testDamageDealt(game, MoveId.SUNSTEEL_STRIKE, true);
    expect(damageWithGift).toBe(damageWithoutGift);
  });

  it("should not increase the damage of a mold breaker ally", async () => {
    const [damageWithGift, damageWithoutGift] = await testDamageDealt(
      game,
      MoveId.TACKLE,
      true,
      AbilityId.MOLD_BREAKER,
    );
    expect(damageWithGift).toBe(damageWithoutGift);
  });

  it("should decrease the damage an ally takes from a special attack", async () => {
    const [damageWithoutGift, damageWithGift] = await testDamageDealt(game, MoveId.MUD_SLAP, false);
    expect(damageWithGift).toBeLessThan(damageWithoutGift);
  });

  it("should not decrease the damage an ally takes from a mold breaker enemy using a special attack", async () => {
    const [damageWithoutGift, damageWithGift] = await testDamageDealt(
      game,
      MoveId.MUD_SLAP,
      false,
      AbilityId.BALL_FETCH,
      AbilityId.MOLD_BREAKER,
    );
    expect(damageWithGift).toBe(damageWithoutGift);
  });

  it("changes the Pokemon's form during Harsh Sunlight", async () => {
    game.override.weather(WeatherType.HARSH_SUN);
    await game.classicMode.startBattle([SpeciesId.CHERRIM]);

    const cherrim = game.field.getPlayerPokemon();
    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);

    game.move.select(MoveId.SPLASH);
  });

  it("reverts to Overcast Form if a Pokémon on the field has Air Lock", async () => {
    await testRevertFormAgainstAbility(game, AbilityId.AIR_LOCK);
  });

  it("reverts to Overcast Form if a Pokémon on the field has Cloud Nine", async () => {
    await testRevertFormAgainstAbility(game, AbilityId.CLOUD_NINE);
  });

  it("reverts to Overcast Form when the Flower Gift is suppressed, changes form under Harsh Sunlight/Sunny when it regains it", async () => {
    game.override.enemyMoveset([MoveId.GASTRO_ACID]).weather(WeatherType.HARSH_SUN);

    await game.classicMode.startBattle([SpeciesId.CHERRIM, SpeciesId.MAGIKARP]);

    const cherrim = game.field.getPlayerPokemon();

    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);

    game.move.select(MoveId.SPLASH);
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

    await game.classicMode.startBattle([SpeciesId.CASTFORM, SpeciesId.MAGIKARP]);
    const cherrim = game.field.getPlayerPokemon();

    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(cherrim.formIndex).toBe(OVERCAST_FORM);
  });
});
