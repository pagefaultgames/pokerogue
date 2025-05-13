import { BattlerIndex } from "#app/battle";
import { allAbilities } from "#app/data/data-lists";
import { Abilities } from "#app/enums/abilities";
import { Stat } from "#app/enums/stat";
import { WeatherType } from "#app/enums/weather-type";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
   * @param {Abilities} ability The ability that is active on the field
   */
  const testRevertFormAgainstAbility = async (game: GameManager, ability: Abilities) => {
    game.override.starterForms({ [Species.CASTFORM]: SUNSHINE_FORM }).enemyAbility(ability);
    await game.classicMode.startBattle([Species.CASTFORM]);

    game.move.select(Moves.SPLASH);

    expect(game.scene.getPlayerPokemon()?.formIndex).toBe(OVERCAST_FORM);
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
    move: Moves,
    allyAttacker: boolean,
    allyAbility = Abilities.BALL_FETCH,
    enemyAbility = Abilities.BALL_FETCH,
  ): Promise<[number, number]> => {
    game.override.battleStyle("double");
    game.override.moveset([Moves.SPLASH, Moves.SUNNY_DAY, move, Moves.HEAL_PULSE]);
    game.override.enemyMoveset([Moves.SPLASH, Moves.HEAL_PULSE]);
    const target_index = allyAttacker ? BattlerIndex.ENEMY : BattlerIndex.PLAYER_2;
    const attacker_index = allyAttacker ? BattlerIndex.PLAYER_2 : BattlerIndex.ENEMY;
    const ally_move = allyAttacker ? move : Moves.SPLASH;
    const enemy_move = allyAttacker ? Moves.SPLASH : move;
    const ally_target = allyAttacker ? BattlerIndex.ENEMY : null;

    await game.classicMode.startBattle([Species.CHERRIM, Species.MAGIKARP]);
    const target = allyAttacker ? game.scene.getEnemyField()[0] : game.scene.getPlayerField()[1];
    const initialHp = target.getMaxHp();

    // Override the ability for the target and attacker only
    vi.spyOn(game.scene.getPlayerField()[1], "getAbility").mockReturnValue(allAbilities[allyAbility]);
    vi.spyOn(game.scene.getEnemyField()[0], "getAbility").mockReturnValue(allAbilities[enemyAbility]);

    // turn 1
    game.move.select(Moves.SUNNY_DAY, 0);
    game.move.select(ally_move, 1, ally_target);
    await game.forceEnemyMove(enemy_move, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    // Ensure sunny day is used last.
    await game.setTurnOrder([attacker_index, target_index, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to(TurnEndPhase);
    const damageWithoutGift = initialHp - target.hp;

    target.hp = initialHp;

    // turn 2. Make target use recover to reset hp calculation.
    game.move.select(Moves.SPLASH, 0, target_index);
    game.move.select(ally_move, 1, ally_target);
    await game.forceEnemyMove(enemy_move, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
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
      .moveset([Moves.SPLASH, Moves.SUNSTEEL_STRIKE, Moves.SUNNY_DAY, Moves.MUD_SLAP])
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyLevel(100)
      .startingLevel(100);
  });

  it("increases the ATK and SPDEF stat stages of the Pokémon with this Ability and its allies by 1.5× during Harsh Sunlight", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.CHERRIM, Species.MAGIKARP]);

    const [cherrim, magikarp] = game.scene.getPlayerField();
    const cherrimAtkStat = cherrim.getEffectiveStat(Stat.ATK);
    const cherrimSpDefStat = cherrim.getEffectiveStat(Stat.SPDEF);

    const magikarpAtkStat = magikarp.getEffectiveStat(Stat.ATK);
    const magikarpSpDefStat = magikarp.getEffectiveStat(Stat.SPDEF);

    game.move.select(Moves.SUNNY_DAY, 0);
    game.move.select(Moves.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(cherrim.formIndex).toBe(SUNSHINE_FORM);
    expect(cherrim.getEffectiveStat(Stat.ATK)).toBe(Math.floor(cherrimAtkStat * 1.5));
    expect(cherrim.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(cherrimSpDefStat * 1.5));
    expect(magikarp.getEffectiveStat(Stat.ATK)).toBe(Math.floor(magikarpAtkStat * 1.5));
    expect(magikarp.getEffectiveStat(Stat.SPDEF)).toBe(Math.floor(magikarpSpDefStat * 1.5));
  });

  it("should not increase the damage of an ally using an ability ignoring move", async () => {
    const [damageWithGift, damageWithoutGift] = await testDamageDealt(game, Moves.SUNSTEEL_STRIKE, true);
    expect(damageWithGift).toBe(damageWithoutGift);
  });

  it("should not increase the damage of a mold breaker ally", async () => {
    const [damageWithGift, damageWithoutGift] = await testDamageDealt(game, Moves.TACKLE, true, Abilities.MOLD_BREAKER);
    expect(damageWithGift).toBe(damageWithoutGift);
  });

  it("should decrease the damage an ally takes from a special attack", async () => {
    const [damageWithoutGift, damageWithGift] = await testDamageDealt(game, Moves.MUD_SLAP, false);
    expect(damageWithGift).toBeLessThan(damageWithoutGift);
  });

  it("should not decrease the damage an ally takes from a mold breaker enemy using a special attack", async () => {
    const [damageWithoutGift, damageWithGift] = await testDamageDealt(
      game,
      Moves.MUD_SLAP,
      false,
      Abilities.BALL_FETCH,
      Abilities.MOLD_BREAKER,
    );
    expect(damageWithGift).toBe(damageWithoutGift);
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

  it("reverts to Overcast Form when the Flower Gift is suppressed, changes form under Harsh Sunlight/Sunny when it regains it", async () => {
    game.override.enemyMoveset([Moves.GASTRO_ACID]).weather(WeatherType.HARSH_SUN);

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
