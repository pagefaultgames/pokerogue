import { allMoves, modifierTypes } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { EnemyPersistentModifier } from "#modifiers/modifier";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Battle Mechanics - Damage Calculation", () => {
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100)
      .criticalHits(false)
      .moveset([MoveId.TACKLE, MoveId.DRAGON_RAGE, MoveId.FISSURE, MoveId.JUMP_KICK]);
  });

  it("Tackle deals expected base damage", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const playerPokemon = game.field.getPlayerPokemon();
    vi.spyOn(playerPokemon, "getEffectiveStat").mockReturnValue(80);

    const enemyPokemon = game.field.getEnemyPokemon();
    vi.spyOn(enemyPokemon, "getEffectiveStat").mockReturnValue(90);

    // expected base damage = [(2*level/5 + 2) * power * playerATK / enemyDEF / 50] + 2
    //                      = 31.8666...
    expect(enemyPokemon.getAttackDamage({ source: playerPokemon, move: allMoves[MoveId.TACKLE] }).damage).toBeCloseTo(
      31,
    );
  });

  it("Attacks deal 1 damage at minimum", async () => {
    game.override.startingLevel(1).enemySpecies(SpeciesId.AGGRON);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const aggron = game.field.getEnemyPokemon();

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);

    // Lvl 1 0 Atk Magikarp Tackle vs. 0 HP / 0 Def Aggron: 1-1 (0.3 - 0.3%) -- possibly the worst move ever
    expect(aggron.hp).toBe(aggron.getMaxHp() - 1);
  });

  it("Attacks deal 1 damage at minimum even with many tokens", async () => {
    game.override.startingLevel(1).enemySpecies(SpeciesId.AGGRON).enemyAbility(AbilityId.STURDY).enemyLevel(10000);

    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const dmg_redux_modifier = modifierTypes.ENEMY_DAMAGE_REDUCTION().newModifier() as EnemyPersistentModifier;
    dmg_redux_modifier.stackCount = 1000;
    await game.scene.addEnemyModifier(modifierTypes.ENEMY_DAMAGE_REDUCTION().newModifier() as EnemyPersistentModifier);

    const aggron = game.field.getEnemyPokemon();

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(aggron.hp).toBe(aggron.getMaxHp() - 1);
  });

  it("Fixed-damage moves ignore damage multipliers", async () => {
    game.override.enemySpecies(SpeciesId.DRAGONITE).enemyAbility(AbilityId.MULTISCALE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const magikarp = game.field.getPlayerPokemon();
    const dragonite = game.field.getEnemyPokemon();

    expect(dragonite.getAttackDamage({ source: magikarp, move: allMoves[MoveId.DRAGON_RAGE] }).damage).toBe(40);
  });

  it("One-hit KO moves ignore damage multipliers", async () => {
    game.override.enemySpecies(SpeciesId.AGGRON).enemyAbility(AbilityId.MULTISCALE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const magikarp = game.field.getPlayerPokemon();
    const aggron = game.field.getEnemyPokemon();

    expect(aggron.getAttackDamage({ source: magikarp, move: allMoves[MoveId.FISSURE] }).damage).toBe(aggron.hp);
  });

  it("When the user fails to use Jump Kick with Wonder Guard ability, the damage should be 1.", async () => {
    game.override.enemySpecies(SpeciesId.GASTLY).ability(AbilityId.WONDER_GUARD);

    await game.classicMode.startBattle([SpeciesId.SHEDINJA]);

    const shedinja = game.field.getPlayerPokemon();

    game.move.select(MoveId.JUMP_KICK);

    await game.phaseInterceptor.to("DamageAnimPhase");

    expect(shedinja.hp).toBe(shedinja.getMaxHp() - 1);
  });

  it("Charizard with odd HP survives Stealth Rock damage twice", async () => {
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, MoveId.STEALTH_ROCK, 0);
    game.override.seed("Charizard Stealth Rock test").enemySpecies(SpeciesId.CHARIZARD).enemyAbility(AbilityId.BLAZE);

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const charizard = game.field.getEnemyPokemon();

    if (charizard.getMaxHp() % 2 === 1) {
      expect(charizard.hp).toBeGreaterThan(charizard.getMaxHp() / 2);
    } else {
      expect(charizard.hp).toBe(charizard.getMaxHp() / 2);
    }
  });
});
